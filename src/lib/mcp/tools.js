import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClickUpTasks, getVisibleLists, teamWeekTasks, activeSprints, getListProgress, flattenTasks } from "@/lib/data/clickup";
import { getSlackTickets } from "@/lib/data/slack";
import { getMeetings, getMeeting, getMeetingFolders } from "@/lib/data/granola";
import { setClickUpTaskStatus } from "@/lib/actions/clickup";
import { madridDateISO } from "@/lib/dates";
import { roleOf } from "@/lib/team";
import { normalizeName } from "@/lib/projects";
import { POLICIES } from "@/lib/content";

// Lo que F*ctito contesta desde fuera (el ChatGPT del equipo).
//
// La cuenta de ChatGPT es COMPARTIDA: no hay forma de saber si quien pregunta
// es Mariola o Carles. Así que no existe nada "mío" —ni mis tareas ni mis
// vacaciones—; todo lo que devuelve es información de equipo, la misma que
// cualquiera vería entrando al portal.
//
// De ahí salen los límites, que no son un olvido:
//   · Fuera Adhōc y los proyectos de cliente propio: no son del equipo.
//   · Fuera las listas de Management y todo lo marcado como solo admin.
//   · Fuera nóminas, contratos, banco, salarios, documentos y los saldos de
//     vacaciones de nadie. Quién está fuera y cuándo sí; el resto no.
//   · De las reuniones, solo las carpetas de Granola en la lista blanca, y de
//     cada una el resumen: ni transcripción ni notas privadas.
//
// Las lecturas se hacen bajo una identidad sintética de miembro interno (ver
// la ruta), así que heredan exactamente ese recorte sin repetir la regla.

// Las fechas llegan de dos sitios: las tareas en ms de ClickUp y las listas en
// ISO desde Supabase. Se aceptan las dos y nunca se lanza por una mala.
function dia(v) {
  if (!v) return null;
  const d = new Date(typeof v === "number" || /^\d+$/.test(String(v)) ? Number(v) : v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const tarea = (t) => ({
  id: t.id,
  nombre: t.name,
  estado: t.status,
  cliente: t.project ?? null,
  proyecto: t.listName ?? null,
  vence: dia(t.dueDate),
  personas: (t.assignees ?? []).map((a) => a.name).filter(Boolean),
  url: t.url,
});

export const HERRAMIENTAS = [
  {
    name: "tareas_de_la_semana",
    description:
      "Lo que tiene el equipo esta semana: tareas abiertas que vencen en los próximos 7 días o que ya están vencidas. Se puede acotar a una persona por su nombre.",
    inputSchema: {
      type: "object",
      properties: { persona: { type: "string", description: "Nombre de pila, p. ej. «Mariola». Sin esto, todo el equipo." } },
    },
    run: async ({ persona } = {}) => {
      const tasks = await getClickUpTasks();
      const semana = teamWeekTasks(tasks).map(tarea);
      if (!persona) return { tareas: semana };
      const q = normalizeName(persona);
      return {
        persona,
        tareas: semana.filter((t) => t.personas.some((n) => normalizeName(n).startsWith(q))),
      };
    },
  },
  {
    name: "proyectos",
    description:
      "Proyectos y sprints en curso que esa persona puede ver, con cliente, fechas, avance y cuántas tareas quedan abiertas.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const [lists, tasks] = await Promise.all([getVisibleLists(), getClickUpTasks()]);
      const progreso = await getListProgress(lists.filter((l) => l.list_start || l.list_due).map((l) => l.list_id));
      return {
        proyectos: activeSprints(lists, tasks, null, progreso).map((s) => ({
          id: s.id,
          nombre: s.name,
          cliente: s.client,
          estado: s.phase?.estado ?? null,
          inicio: dia(s.start),
          fin: dia(s.due),
          avance: `${s.done}/${s.total}`,
          abiertas: s.active,
          vencidas: s.overdue,
        })),
      };
    },
  },
  {
    name: "tareas_de_proyecto",
    description: "Todas las tareas de un proyecto o sprint, por su nombre. Sirve para ver cómo va algo concreto.",
    inputSchema: {
      type: "object",
      properties: { proyecto: { type: "string", description: "Nombre del proyecto o sprint, p. ej. «Black Friday»" } },
      required: ["proyecto"],
    },
    run: async ({ proyecto }) => {
      const [lists, tasks] = await Promise.all([getVisibleLists(), getClickUpTasks()]);
      const q = String(proyecto || "").toLowerCase().trim();
      const lista = lists.find((l) => (l.list_name || "").toLowerCase().includes(q));
      if (!lista) return { error: `No veo ningún proyecto que se llame «${proyecto}».` };
      const suyas = flattenTasks(tasks).filter((t) => String(t.listId) === String(lista.list_id));
      return { proyecto: lista.list_name, cliente: lista.folder_name, tareas: suyas.map(tarea) };
    },
  },
  {
    name: "cambiar_estado_tarea",
    description:
      "Cambia el estado de una tarea en ClickUp (por ejemplo a «in progress» o «complete»). Es lo mismo que puede hacer cualquiera desde el portal.",
    inputSchema: {
      type: "object",
      properties: {
        tarea_id: { type: "string", description: "id de la tarea en ClickUp" },
        estado: { type: "string", description: "Nombre exacto del estado destino" },
      },
      required: ["tarea_id", "estado"],
    },
    run: async ({ tarea_id, estado }) => {
      const r = await setClickUpTaskStatus(tarea_id, estado);
      return r?.ok ? { ok: true } : { error: r?.error || "No se pudo cambiar el estado." };
    },
  },
  {
    name: "quien_esta_fuera",
    description:
      "Quién del equipo está de vacaciones o ausente, y los festivos y cumpleaños próximos. Solo dice quién y cuándo, nunca el motivo.",
    inputSchema: {
      type: "object",
      properties: { dias: { type: "number", description: "Ventana en días hacia delante (30 por defecto)" } },
    },
    run: async ({ dias = 30 }) => {
      const supabase = createAdminClient();
      if (!supabase) return { eventos: [] };
      const hoy = madridDateISO();
      const hasta = new Date(new Date(`${hoy}T00:00:00`).getTime() + dias * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("calendar_events")
        .select("type, title, start_date, end_date")
        .lte("start_date", hasta)
        .gte("end_date", hoy)
        .order("start_date");
      return { eventos: (data ?? []).map((e) => ({ tipo: e.type, titulo: e.title, desde: e.start_date, hasta: e.end_date })) };
    },
  },
  {
    name: "como_trabajamos",
    description:
      "Las políticas del estudio: horarios y flexibilidad, vacaciones y festivos, comunicación… Lo que hay escrito sobre cómo se trabaja aquí.",
    inputSchema: {
      type: "object",
      properties: { tema: { type: "string", description: "Filtra por tema, p. ej. «vacaciones». Sin esto, el índice." } },
    },
    run: async ({ tema } = {}) => {
      if (!tema) return { politicas: POLICIES.map((p) => ({ id: p.id, titulo: p.title, resumen: p.summary ?? null })) };
      const q = normalizeName(tema);
      const p = POLICIES.find((x) => normalizeName(x.title).includes(q) || normalizeName(x.id).includes(q));
      if (!p) return { error: `No hay ninguna política sobre «${tema}».` };
      return { politica: p };
    },
  },
  {
    name: "equipo",
    description:
      "Quién es quién en el estudio: nombre, puesto, email de trabajo y si es plantilla o colabora desde fuera. Nada de datos personales.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const supabase = createAdminClient();
      if (!supabase) return { equipo: [] };
      const CAMPOS = "name, last_name, role, email, is_external";
      // access_role llega con la migración 0035; hasta entonces el vínculo se
      // deduce de is_external, igual que hace roleOf().
      let { data } = await supabase.from("employees").select(`${CAMPOS}, access_role`).eq("active", true).order("name");
      if (!data) ({ data } = await supabase.from("employees").select(CAMPOS).eq("active", true).order("name"));
      return {
        equipo: (data ?? []).map((e) => ({
          nombre: [e.name, e.last_name].filter(Boolean).join(" "),
          puesto: e.role || null,
          email: e.email,
          vinculo: roleOf(e),
        })),
      };
    },
  },
  {
    name: "tickets",
    description: "Peticiones abiertas que llegan de los canales compartidos de Slack, con su estado y quién las lleva.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const tickets = await getSlackTickets();
      return {
        tickets: tickets.map((t) => ({
          titulo: t.title,
          estado: t.status,
          responsable: t.assignee,
          pidio: t.author,
          canal: t.list,
          url: t.url,
        })),
      };
    },
  },
  {
    name: "reuniones",
    description:
      "Reuniones del equipo con notas en Granola (status, plannings, kickoffs), de la más reciente a la más antigua. Devuelve título, fecha y carpeta; para leer lo que se dijo hay que pedir la reunión por su id con «reunion». Solo se ven las carpetas de equipo, no las reuniones privadas.",
    inputSchema: {
      type: "object",
      properties: {
        carpeta: { type: "string", description: "Acota a una carpeta, p. ej. «Creative Team / Status». Sin esto, todas las de equipo." },
        desde: { type: "string", description: "Fecha ISO (AAAA-MM-DD): solo reuniones de ese día en adelante." },
        limite: { type: "number", description: "Cuántas devolver, 20 por defecto y 50 como mucho." },
      },
    },
    run: async ({ carpeta, desde, limite } = {}) => {
      const [reuniones, carpetas] = await Promise.all([
        getMeetings({ carpeta, desde, limite }),
        getMeetingFolders(),
      ]);
      return { reuniones, carpetas: carpetas.map((c) => c.ruta) };
    },
  },
  {
    name: "reunion",
    description:
      "El resumen de una reunión concreta por su id (el que devuelve «reuniones»): qué se habló, qué se decidió y quién estaba. No incluye la transcripción ni las notas privadas de nadie.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Id de la reunión, p. ej. «not_3gEAVvXkV1xuCT»." } },
      required: ["id"],
    },
    run: async ({ id } = {}) => {
      const r = await getMeeting(id);
      // Sin encontrarla no se distingue "no existe" de "no es de equipo", y así
      // debe ser: decir cuál de las dos ya sería contar algo de la otra.
      if (!r) return { error: "No hay ninguna reunión de equipo con ese id." };
      return { reunion: r };
    },
  },
];

export const herramientasPara = () => HERRAMIENTAS;
