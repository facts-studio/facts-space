import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClickUpTasks, getVisibleLists, weekTasks, activeSprints, getListProgress, flattenTasks, isMine } from "@/lib/data/clickup";
import { getSlackTickets } from "@/lib/data/slack";
import { setClickUpTaskStatus } from "@/lib/actions/clickup";
import { madridDateISO } from "@/lib/dates";
import { isColaborador, roleOf } from "@/lib/team";

// Herramientas que el equipo puede usar desde fuera (ChatGPT, Claude…).
//
// Regla de oro: cada una responde COMO la persona del token. Las lecturas que
// pasan por getVisibleLists ya heredan su recorte (Adhōc, Management, listas
// desactivadas); las que van directas a Supabase filtran aquí a mano, porque
// sin sesión de navegador no hay RLS que las proteja.
//
// Lo que NO se expone, y no es un olvido: nóminas, contratos, datos bancarios,
// salarios, documentos y las ausencias de los demás. Un token perdido no puede
// convertirse en una fuga de datos personales del equipo.

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
    name: "mis_tareas",
    description:
      "Las tareas de quien pregunta para esta semana: abiertas con fecha en los próximos 7 días o ya vencidas. Es la respuesta a «¿qué tengo que hacer?».",
    inputSchema: { type: "object", properties: {} },
    run: async (_args, me) => {
      const tasks = await getClickUpTasks();
      return { tareas: weekTasks(tasks, me?.email).map(tarea) };
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
    name: "mis_vacaciones",
    description:
      "Saldo de vacaciones de quien pregunta y sus solicitudes: cuántos días le quedan este año y en qué estado está cada una. Solo las suyas.",
    inputSchema: { type: "object", properties: {} },
    run: async (_args, me) => {
      const supabase = createAdminClient();
      if (!supabase || !me) return { error: "No disponible." };
      const año = madridDateISO().slice(0, 4);
      const { data } = await supabase
        .from("vacation_requests")
        .select("start_date, end_date, working_days, status, type")
        .eq("employee_id", me.id)
        .gte("start_date", `${año}-01-01`)
        .order("start_date");
      const usados = (data ?? [])
        .filter((v) => v.status === "approved" && v.type === "vacaciones")
        .reduce((s, v) => s + Number(v.working_days || 0), 0);
      const total = Number(me.vacation_allowance || 0) + Number(me.vacation_adjustment || 0);
      return {
        dias_totales: total,
        dias_usados: usados,
        dias_restantes: total - usados,
        solicitudes: (data ?? []).map((v) => ({ desde: v.start_date, hasta: v.end_date, dias: v.working_days, tipo: v.type, estado: v.status })),
      };
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
];

// Un colaborador entra solo por sus proyectos: el resto de herramientas hablan
// del equipo y no le tocan.
const SOLO_COLABORADOR = new Set(["mis_tareas", "proyectos", "tareas_de_proyecto", "cambiar_estado_tarea"]);

export function herramientasPara(me) {
  return isColaborador(me) ? HERRAMIENTAS.filter((h) => SOLO_COLABORADOR.has(h.name)) : HERRAMIENTAS;
}

export { isMine };
