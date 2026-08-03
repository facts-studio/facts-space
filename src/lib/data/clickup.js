import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, getCurrentEmployee } from "./helpers";
import { TEAM } from "@/lib/mock";

const stripAccents = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const TEAM_BY_FIRST = new Map(TEAM.map((m) => [stripAccents(m.name).split(" ")[0], m]));

// Asignación desde el custom field "Asignado a" (labels). Devuelve array de
// asignados (email/nombre desde el área Equipo) o null si la tarea no usa el
// campo (entonces se cae a la persona asignada real de ClickUp).
function assigneesFromField(t) {
  const f = (t.custom_fields || []).find((cf) => cf.type === "labels" && stripAccents(cf.name).includes("asignado a"));
  if (!f || f.value == null) return null;
  const byId = new Map(((f.type_config || {}).options || []).map((o) => [o.id, o.label ?? o.name]));
  const labels = (Array.isArray(f.value) ? f.value : [f.value]).map((id) => byId.get(id)).filter(Boolean);
  if (!labels.length) return null;
  // "Todos" → sin dueño concreto (visible para todo el equipo).
  const people = labels.filter((l) => stripAccents(l) !== "todos");
  return people.map((label) => {
    const m = TEAM_BY_FIRST.get(stripAccents(label).split(" ")[0]);
    return { email: m?.email ?? null, name: m?.name ?? label, initials: (label[0] || "?").toUpperCase(), color: null };
  });
}

// Asignación desde los GRUPOS ("Persona asignada = Equipo:Nombre"). Fuente
// principal tras mover la asignación de usuarios a grupos. Grupo → miembro del
// área Equipo (para email/foto). null si la tarea no tiene grupos.
// Caso especial: el grupo "Team" equivale a TODA la plantilla (se expande a
// todos los miembros), como si la tarea se asignara a todo el equipo.
const memberAssignee = (m, fallbackLabel) => ({
  email: m?.email ?? null,
  name: m?.name ?? fallbackLabel,
  initials: ((m?.name ?? fallbackLabel ?? "?")[0] || "?").toUpperCase(),
  color: null,
});
const isTeamGroup = (name) => {
  const n = stripAccents(name);
  return n === "team" || n === "todos" || n === "todo el equipo";
};
function assigneesFromGroups(t) {
  const gs = t.group_assignees;
  if (!Array.isArray(gs) || !gs.length) return null;
  // Si la tarea tiene el grupo "Team" (= todos), se muestra SOLO el icono de
  // Team; representa a todo el equipo (no se listan las personas ni las subtareas).
  if (gs.some((g) => isTeamGroup(g.name))) {
    return [{ team: true, email: null, name: "Team", initials: "T", color: null }];
  }
  const out = [];
  const seen = new Set();
  const add = (a) => { const k = a.email || a.name; if (k && !seen.has(k)) { seen.add(k); out.push(a); } };
  for (const g of gs) add(memberAssignee(TEAM_BY_FIRST.get(stripAccents(g.name).split(" ")[0]), g.name));
  return out.length ? out : null;
}

// Ficheros del campo custom "📁 Recursos" (tipo attachment): pdfs, imágenes,
// docs… relacionados con la tarea. Devuelve array normalizado o null.
function resourcesFromField(t) {
  const f = (t.custom_fields || []).find(
    (cf) => cf.type === "attachment" && stripAccents(cf.name).includes("recurso")
  );
  if (!f || !Array.isArray(f.value) || !f.value.length) return null;
  const files = f.value
    .filter((a) => !a.deleted && !a.hidden)
    .map((a) => ({
      id: a.id,
      title: a.title || a.id,
      ext: (a.extension || "").toLowerCase(),
      mimetype: a.mimetype || null,
      size: typeof a.size === "number" ? a.size : null,
      url: a.url_w_host || a.url || null,
      thumb: a.thumbnail_medium || a.thumbnail_small || null,
    }))
    .filter((a) => a.url);
  return files.length ? files : null;
}

// Enlaces escritos DENTRO de la descripción. En ClickUp mucha gente pega el
// Figma/Drive en el texto en vez de en el campo "📁 Recursos", así que también
// cuentan como recurso. Devuelve el mismo shape que `resourcesFromField`.
function linksFromText(text) {
  if (!text) return [];
  const out = [];
  const seen = new Set();
  // Corta en el primer espacio o carácter de cierre; luego se limpia la
  // puntuación final típica de escribir "…(mira esto: https://x.com/a)."
  for (const m of text.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
    const url = m[0].replace(/[.,;:!?)\]}>]+$/, "");
    if (seen.has(url)) continue;
    seen.add(url);
    let title = url;
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      // "figma.com/file/abc" es más útil que solo el dominio, pero sin la
      // ristra de parámetros.
      const path = u.pathname.replace(/\/$/, "");
      title = path && path !== "/" ? `${host}${path.length > 28 ? `${path.slice(0, 28)}…` : path}` : host;
    } catch {
      // URL no parseable: se deja el texto tal cual.
    }
    out.push({ id: `link-${url}`, title, url, kind: "link", ext: "", mimetype: null, size: null, thumb: null });
  }
  return out;
}

// Cliente/campaña desde el TAG. Mapa tag → nombre bonito (coincide con las
// claves de iconos/colores del admin). Devuelve null si no hay tag de cliente.
// Nota: "unfiltrade" ya NO es un cliente — ahora es una RAMA (Space). Las tareas
// que arrastran ese tag legado caen a su carpeta real (p. ej. "General").
const CLIENT_TAGS = {
  "tradinglab": "TradingLab", "flickflow": "Flickflow",
  "bmk": "The BenchMark", "alexruiz": "Alex Ruiz", "f*cts": "F*cts Studio",
  "evento 2026": "Evento 2026", "tradingmind": "TradingMind", "black friday": "Black Friday",
};
function clientFromTags(t) {
  for (const tag of t.tags || []) {
    const label = CLIENT_TAGS[(tag.name || "").toLowerCase()];
    if (label) return label;
  }
  return null;
}

// ── Integración ClickUp ───────────────────────────────────────────────────
// El portal actúa como noticiario: se nutre de ClickUp para decirle a cada uno
// sus tareas de hoy y la situación general. Auth por token de workspace
// (CLICKUP_API_TOKEN + CLICKUP_TEAM_ID). Sin token → fallback a mock para
// desarrollo, igual que el resto de la capa de datos.
//
// Doc API v2: https://clickup.com/api  (endpoint "Filtered Team Tasks").

const BASE = "https://api.clickup.com/api/v2";

export function isClickUpConfigured() {
  return Boolean(process.env.CLICKUP_API_TOKEN && process.env.CLICKUP_TEAM_ID);
}

// Shape normalizado que consume el portal:
// { id, name, url, status, statusColor, listName, dueDate(ms|null), assignees:[{email,name,initials,color}] }
function mapTask(t) {
  const description = (t.text_content || t.description || "").trim() || null;
  // Recursos = adjuntos del campo "📁 Recursos" + enlaces de la descripción.
  // Los enlaces se buscan en markdown_description porque los embeds de ClickUp
  // (Figma, Drive…) NO aparecen en text_content ni en description.
  const files = resourcesFromField(t) || [];
  const urls = new Set(files.map((f) => f.url));
  const texto = [t.markdown_description, t.description, t.text_content].filter(Boolean).join("\n");
  const resources = [...files, ...linksFromText(texto).filter((l) => !urls.has(l.url))];
  return {
    id: t.id,
    name: t.name,
    url: t.url ?? null,
    status: t.status?.status ?? "abierta",
    statusColor: t.status?.color ?? null,
    statusType: t.status?.type ?? null, // open | custom | closed | done…
    listName: t.list?.name ?? t.project?.name ?? null, // disciplina (Management/Copy/…)
    listId: t.list?.id ?? null,
    // Cliente = tag (opción B); si no hay tag de cliente, cae a la carpeta/space.
    project: clientFromTags(t) ?? (t.folder?.name && !t.folder?.hidden ? t.folder.name : (t.space?.name ?? null)),
    // Rama (Space) a la que pertenece: F*cts Studio (nosotros) o Unfiltrade
    // (cliente-holding). Sirve para agrupar los clientes por rama en Tareas.
    space: t.space?.name ?? null,
    priority: t.priority?.priority ?? null,
    // ClickUp marca los hitos (milestones) con custom_item_id === 1.
    isMilestone: t.custom_item_id === 1,
    description,
    resources: resources.length ? resources : null, // adjuntos + enlaces del texto
    dueDate: t.due_date ? Number(t.due_date) : null,
    // ClickUp marca con `due_date_time` si la fecha lleva hora. Cuando no la
    // lleva, el timestamp cae igualmente a una hora fija (p. ej. 04:00) que NO
    // hay que enseñar: si no, una tarea "para hoy" aparece como "Hoy · 04:00".
    dueHasTime: Boolean(t.due_date_time),
    startDate: t.start_date ? Number(t.start_date) : null,
    dateDone: t.date_done ? Number(t.date_done) : null, // para "completadas" en Status
    // Jerarquía: para plegar subtareas en su tarea de nivel superior.
    parentId: t.parent ?? null,
    topParentId: t.top_level_parent ?? null,
    // Tarea de "Team" = asignada a todo el equipo (matchea a todos y no sube subtareas).
    everyone: (t.group_assignees ?? []).some((g) => isTeamGroup(g.name)),
    // Asignación: grupos (Equipo) → campo "Asignado a" → persona asignada real.
    assignees: assigneesFromGroups(t) ?? assigneesFromField(t) ?? (t.assignees ?? []).map((a) => ({
      email: a.email ?? null,
      name: a.username ?? a.email ?? "—",
      initials: a.initials ?? null,
      color: a.color ?? null,
    })),
  };
}

// Pliega las subtareas dentro de su tarea padre:
//  1) sube los asignados de cada subtarea a la tarea RAÍZ (para que quien está
//     en una subtarea vea también la tarea padre y su avatar lo refleje).
//  2) adjunta las subtareas DIRECTAS a su padre en `t.subtasks` (anidable),
//     para poder desplegarlas en el panel de detalle.
// Devuelve solo las tareas de nivel superior; las subtareas cuyo padre está en
// el conjunto se pliegan dentro. Las huérfanas (padre no traído) se conservan.
function rollUpSubtasks(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const merge = (into, from) => {
    for (const a of from) {
      const key = a.email || a.name;
      if (!into.some((x) => (x.email || x.name) === key)) into.push(a);
    }
  };
  // Conserva los asignados DIRECTOS de cada tarea antes de heredar (Inicio los
  // necesita para mostrar la subtarea concreta, no el padre).
  for (const t of tasks) t.ownAssignees = t.assignees.slice();
  for (const t of tasks) {
    // Asignados → suben a la tarea raíz (top-level), salvo si la raíz es de
    // "Team" (ya representa a todos: no hace falta subir las subtareas).
    const topId = t.topParentId && t.topParentId !== t.id ? t.topParentId : null;
    if (topId && byId.has(topId) && !byId.get(topId).everyone) merge(byId.get(topId).assignees, t.assignees);
    // Subtarea → se adjunta a su padre directo.
    if (t.parentId && byId.has(t.parentId)) {
      const p = byId.get(t.parentId);
      (p.subtasks ??= []).push(t);
    }
  }
  for (const t of tasks) {
    if (t.subtasks) t.subtasks.sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity));
  }
  return tasks.filter((t) => !(t.parentId && byId.has(t.parentId)));
}

const authOpts = () => ({
  headers: { Authorization: process.env.CLICKUP_API_TOKEN },
  next: { revalidate: 60 }, // lo nuevo de ClickUp aparece en ≤1 min
});

// Config del portal: filas de clickup_lists (jerarquía + flag visible). Vacío si
// no hay Supabase o la tabla aún no existe (fallback elegante).
export async function getConfiguredLists() {
  if (!isConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clickup_lists")
      .select("*")
      .order("folder_name", { ascending: true })
      .order("sort", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// Tareas del portal. Orden de preferencia:
//  1) listas ACTIVADAS en el admin (clickup_lists.visible) → filtro list_ids.
//  2) CLICKUP_VIEW_ID (vista fija) como fallback legacy.
//  3) todas las tareas abiertas del workspace.
// Sin token → mock. Cachea 5 min.
export async function getClickUpTasks() {
  if (!isClickUpConfigured()) return MOCK_TASKS;
  const opts = authOpts();
  const team = process.env.CLICKUP_TEAM_ID;
  try {
    const [configured, me] = await Promise.all([getConfiguredLists(), getCurrentEmployee()]);
    const isAdmin = Boolean(me?.is_admin);
    // Visibles = activadas; "bloqueadas" (admin_only) y las de "Management"
    // (privadas por norma) solo para admins.
    const visibleIds = configured
      .filter((l) => l.visible
        && (!l.admin_only || isAdmin)
        && (isAdmin || (l.list_name || "").trim().toLowerCase() !== "management"))
      .map((l) => l.list_id);
    // Listas marcadas como sprint: mini-proyecto temporal DENTRO de un cliente.
    // La tarea conserva su cliente (project) y añade `sprint` con el nombre de
    // la lista; no es un cliente aparte.
    const sprintByList = new Map(configured.filter((l) => l.is_sprint).map((l) => [l.list_id, l.list_name]));
    // El endpoint de tareas NO trae el nombre del Space (solo el id): lo
    // resolvemos desde clickup_lists para poder agrupar los clientes por rama.
    const spaceNameById = new Map(configured.filter((l) => l.space_id).map((l) => [String(l.space_id), l.space_name]));

    if (visibleIds.length) {
      const raw = [];
      // Recorre páginas con unos parámetros extra dados.
      const fetchAll = async (extra) => {
        for (let page = 0; page < 30; page++) {
          // include_markdown_description: los enlaces pegados en la descripción
          // llegan como embed y NO aparecen en text_content/description; solo
          // están en markdown_description. De ahí se sacan los recursos.
          const params = new URLSearchParams({ page: String(page), subtasks: "true", order_by: "due_date", include_markdown_description: "true", ...extra });
          for (const id of visibleIds) params.append("list_ids[]", id);
          const res = await fetch(`${BASE}/team/${team}/task?${params}`, opts);
          if (!res.ok) break;
          const json = await res.json();
          const batch = json.tasks ?? [];
          raw.push(...batch);
          if (batch.length < 100) break;
        }
      };
      // 1) abiertas (sin límite de antigüedad) + 2) cerradas solo de la semana
      //    actual y la anterior (por fecha de completado). Lunes = inicio de semana.
      const now = new Date();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
      const cutoff = startOfWeek.getTime() - 7 * 86400000; // inicio de la semana pasada
      await fetchAll({ include_closed: "false" });
      await fetchAll({ include_closed: "true", date_done_gt: String(cutoff) });
      // Dedup por id (una tarea puede venir en ambas si cambió de estado).
      const seen = new Set();
      const out = [];
      for (const t of raw) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        const m = mapTask(t);
        m.sprint = sprintByList.get(m.listId) ?? null;
        m.space = spaceNameById.get(String(t.space?.id)) ?? m.space; // rama resuelta
        out.push(m);
      }
      // Subtareas → pliega sus asignados en la tarea padre y devuelve top-level.
      return rollUpSubtasks(out);
    }

    if (process.env.CLICKUP_VIEW_ID) {
      const out = [];
      for (let page = 0; page < 20; page++) {
        const res = await fetch(`${BASE}/view/${process.env.CLICKUP_VIEW_ID}/task?page=${page}&include_markdown_description=true`, opts);
        if (!res.ok) break;
        const json = await res.json();
        out.push(...(json.tasks ?? []).map(mapTask));
        if (json.last_page !== false) break;
      }
      return out;
    }

    const params = new URLSearchParams({ order_by: "due_date", subtasks: "false", include_closed: "false", include_markdown_description: "true" });
    const res = await fetch(`${BASE}/team/${team}/task?${params}`, opts);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.tasks ?? []).map(mapTask);
  } catch {
    return [];
  }
}

// Listas de la "Agenda F*cts" (Space Agenda F*cts › folder Calendario). Fuente
// de la agenda de empresa: festivos, cumpleaños e hitos generales. Vacaciones
// se gestiona desde la intranet y se espeja a esta lista (ver actions/vacations).
export const AGENDA_LISTS = {
  vacaciones: "901520598266",
  festivos: "901520598213",
  cumples: "901520597103",
  hitos: "901520598257",
};

const toMadridISO = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(Number(ms)));

// Trae todas las tareas de una lista (paginado).
async function fetchListTasks(listId) {
  const opts = authOpts();
  const out = [];
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`${BASE}/list/${listId}/task?include_closed=true&subtasks=false&page=${page}`, opts);
    if (!res.ok) break;
    const json = await res.json();
    const batch = json.tasks ?? [];
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

// Eventos de la agenda de empresa desde ClickUp: festivos, cumpleaños e hitos.
// Shape de evento: { id, type, title, start, end, who }.
export async function getAgendaEvents() {
  if (!isClickUpConfigured()) return [];
  const range = (t) => {
    const due = t.due_date ? toMadridISO(t.due_date) : null;
    const start = t.start_date ? toMadridISO(t.start_date) : due;
    return { start: start || due, end: due || start };
  };
  const groupOf = (t) => (t.group_assignees || [])[0] || null;
  const whoFromGroups = (t) => {
    const g = groupOf(t);
    if (!g) return null;
    const m = TEAM_BY_FIRST.get(stripAccents(g.name).split(" ")[0]);
    return m?.name ?? g.name;
  };
  try {
    const [fest, cum, hit] = await Promise.all([
      fetchListTasks(AGENDA_LISTS.festivos),
      fetchListTasks(AGENDA_LISTS.cumples),
      fetchListTasks(AGENDA_LISTS.hitos),
    ]);
    const events = [];
    for (const t of fest) if (t.due_date || t.start_date) events.push({ id: `fest-${t.id}`, type: "festivo", title: t.name, ...range(t), who: null });
    // `whoGroupId` es el id del grupo de ClickUp de la persona: lo usa el
    // calendario para relacionar el cumple con un empleado vinculado (activo).
    for (const t of cum) if (t.due_date || t.start_date) events.push({ id: `cum-${t.id}`, type: "cumple", title: t.name, ...range(t), who: whoFromGroups(t), whoGroupId: groupOf(t)?.id ? String(groupOf(t).id) : null });
    for (const t of hit) if (t.due_date || t.start_date) events.push({ id: `hito-${t.id}`, type: "hito", title: t.name, ...range(t), who: null });
    return events;
  } catch {
    return [];
  }
}

/**
 * Hitos de sprint: el inicio y el fin de cada lista marcada como sprint, según
 * las fechas de la propia lista en ClickUp. Salen en el calendario y en las
 * listas de agenda (Lo más cercano) como hitos normales.
 * `note` lleva la definición del sprint (el "content" de la lista).
 */
export async function getSprintEvents() {
  const lists = await getConfiguredLists();
  const iso = (ts) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(ts));
  const out = [];
  for (const l of lists) {
    if (!l.is_sprint || !l.visible) continue;
    // `kind` va aparte del título para poder pintarlo como tag; el título
    // completo se mantiene para quien solo muestra texto (agenda, saludo…).
    const base = { type: "hito", who: null, sprint: l.list_name, client: l.folder_name ?? null, note: (l.list_content || "").trim() || null };
    if (l.list_start) {
      const d = iso(l.list_start);
      out.push({ ...base, id: `sprint-${l.list_id}-ini`, kind: "inicio", title: `${l.list_name} · inicio`, start: d, end: d });
    }
    if (l.list_due) {
      const d = iso(l.list_due);
      out.push({ ...base, id: `sprint-${l.list_id}-fin`, kind: "fin", title: `${l.list_name} · fin`, start: d, end: d });
    }
  }
  return out;
}

// Hitos (milestones, custom_item_id === 1) de TODO el workspace, para el
// calendario de eventos. Independiente de las listas activadas (un hito puede
// crearse en cualquier lista). Shape de evento: { id, type:'hito', title, start, end }.
export async function getClickUpMilestones() {
  if (!isClickUpConfigured()) return [];
  const opts = authOpts();
  const team = process.env.CLICKUP_TEAM_ID;
  const toISO = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(Number(ms)));
  const out = [];
  try {
    for (let page = 0; page < 15; page++) {
      const params = new URLSearchParams({ page: String(page), subtasks: "false", include_closed: "true", order_by: "due_date" });
      const res = await fetch(`${BASE}/team/${team}/task?${params}`, opts);
      if (!res.ok) break;
      const json = await res.json();
      const batch = json.tasks ?? [];
      for (const t of batch) {
        if (t.custom_item_id !== 1 || !t.due_date) continue;
        const due = Number(t.due_date);
        const start = t.start_date ? Number(t.start_date) : due;
        // `client`: mismo criterio que las tareas (tag de cliente → carpeta), para
        // poder teñir el hito con el color de su cliente en el calendario.
        const client = clientFromTags(t) ?? (t.folder?.name && !t.folder?.hidden ? t.folder.name : null);
        out.push({ id: `hito-cu-${t.id}`, type: "hito", title: t.name, start: toISO(Math.min(start, due)), end: toISO(due), who: null, client });
      }
      if (batch.length < 100) break;
    }
  } catch {
    return out;
  }
  return out;
}

// Jerarquía completa desde ClickUp (Space → Folder → List) aplanada a filas de
// clickup_lists. La usa la acción de "Sincronizar" del admin. La disciplina es
// el nombre de la lista; el proyecto, el de la carpeta.
export async function getClickUpHierarchy() {
  if (!isClickUpConfigured()) return [];
  const opts = authOpts();
  const team = process.env.CLICKUP_TEAM_ID;
  const get = async (path) => {
    const res = await fetch(`${BASE}/${path}`, opts);
    if (!res.ok) return {};
    return res.json();
  };
  const rows = [];
  const mapStatuses = (space) =>
    (space.statuses ?? []).map((s) => ({ status: s.status, type: s.type, color: s.color, orderindex: s.orderindex }));
  // ms epoch de ClickUp → ISO (o null). Las fechas de la lista se usan para los
  // hitos de sprint; la descripción ("content"), como definición del sprint.
  const stamp = (ms) => (ms ? new Date(Number(ms)).toISOString() : null);
  const push = (list, folder, space, statuses, sort) =>
    rows.push({
      list_id: list.id,
      list_name: list.name,
      list_content: list.content ?? "",
      list_start: stamp(list.start_date),
      list_due: stamp(list.due_date),
      folder_id: folder?.id ?? null,
      folder_name: folder && !folder.hidden ? folder.name : null,
      space_id: space.id,
      space_name: space.name,
      discipline: list.name,
      task_count: list.task_count ?? 0,
      statuses,
      sort,
    });

  const { spaces = [] } = await get(`team/${team}/space`);
  let sort = 0;
  for (const space of spaces) {
    const statuses = mapStatuses(space);
    const { lists = [] } = await get(`space/${space.id}/list`); // listas sueltas del space
    for (const l of lists) push(l, null, space, statuses, sort++);
    const { folders = [] } = await get(`space/${space.id}/folder`);
    for (const folder of folders) for (const l of folder.lists ?? []) push(l, folder, space, statuses, sort++);
  }
  return rows;
}

// Miembros del workspace (para asignar y mostrar avatares).
export async function getClickUpMembers() {
  if (!isClickUpConfigured()) return [];
  try {
    const res = await fetch(`${BASE}/team/${process.env.CLICKUP_TEAM_ID}`, authOpts());
    if (!res.ok) return [];
    const json = await res.json();
    return (json.team?.members ?? []).map((m) => ({
      id: String(m.user?.id),
      email: m.user?.email ?? null,
      username: m.user?.username ?? m.user?.email ?? "—",
      color: m.user?.color ?? null,
    }));
  } catch {
    return [];
  }
}

// Grupos de usuario del workspace (perfiles de asignación por persona). Son los
// que se vinculan a cada empleado para relacionar los eventos de ClickUp.
export async function getClickUpGroups() {
  if (!isClickUpConfigured()) return [];
  try {
    const res = await fetch(`${BASE}/group?team_id=${process.env.CLICKUP_TEAM_ID}`, authOpts());
    if (!res.ok) return [];
    const json = await res.json();
    return (json.groups ?? [])
      .map((g) => ({ id: String(g.id), name: g.name ?? "—", members: (g.members ?? []).length }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  } catch {
    return [];
  }
}

// ── Selectores (puros) ─────────────────────────────────────────────────────
const DAY = 86400000;
const endOfToday = (now = Date.now()) => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

// Una tarea es "tuya" si no filtras, si es de Team (everyone) o si estás asignado.
const assignedTo = (t, email) => !email || t.everyone || t.assignees.some((a) => a.email === email);
const isOpen = (t) => t.statusType !== "closed" && t.statusType !== "done";

// Tareas "de hoy" de una persona: vencen hoy o están vencidas y siguen abiertas.
export function tasksForToday(tasks, email, now = Date.now()) {
  const limit = endOfToday(now);
  return tasks
    .filter((t) => isOpen(t) && assignedTo(t, email) && t.dueDate && t.dueDate <= limit)
    .sort((a, b) => a.dueDate - b.dueDate);
}

// Todas las tareas abiertas de una persona, ordenadas: vencidas/hoy primero,
// luego próximas por fecha, y las sin fecha al final. Feed completo (/tareas).
export function myTasks(tasks, email, now = Date.now()) {
  const limit = endOfToday(now);
  const rank = (t) => (t.dueDate == null ? 2 : t.dueDate <= limit ? 0 : 1);
  return tasks
    .filter((t) => isOpen(t) && assignedTo(t, email))
    .sort((a, b) => rank(a) - rank(b) || (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity));
}

// Tareas de LA SEMANA para el inicio: abiertas, con fecha, vencidas o que vencen
// en los próximos 7 días, y que sean TUYAS o SIN DUEÑO (sin asignar).
// A NIVEL DE ASIGNACIÓN REAL: si estás en una subtarea (y no en el padre), se
// muestra la SUBTAREA marcada (`isSubtask` + `parentName`), no la tarea padre.
export function weekTasks(tasks, email, now = Date.now()) {
  const horizon = new Date(now);
  horizon.setHours(23, 59, 59, 999);
  horizon.setDate(horizon.getDate() + 7);
  const limit = horizon.getTime();
  const out = [];
  const visit = (t, parent) => {
    // Asignación DIRECTA a esta tarea/subtarea (no heredada), o tarea de Team.
    const own = t.ownAssignees ?? t.assignees;
    const direct = t.everyone || (email && own.some((a) => a.email === email));
    // "Sin dueño" solo aplica a tareas de nivel superior sin nadie asignado.
    const unowned = !parent && (t.assignees?.length ?? 0) === 0;
    if (isOpen(t) && t.dueDate && t.dueDate <= limit && (direct || unowned)) {
      out.push(parent ? { ...t, isSubtask: true, parentName: parent.name } : t);
    }
    for (const s of t.subtasks ?? []) visit(s, t);
  };
  for (const t of tasks) visit(t, null);
  return out.sort((a, b) => a.dueDate - b.dueDate);
}

// Igual que weekTasks pero de TODO el equipo (sin filtrar por asignación).
// Alimenta el modo "Status" de Inicio, donde se agrupan por cliente. Trabaja con
// semanas de calendario (lunes–domingo) y etiqueta cada tarea con `bucket`:
//   "activa"     → abierta, vence esta semana (incluye vencidas)
//   "siguiente"  → abierta, vence la semana que viene
//   "completada" → cerrada esta semana o la pasada
// La privacidad ya está resuelta aguas arriba: getClickUpTasks no trae las listas
// admin_only (p. ej. Management) a quien no es admin, así que no expone de más.
export function teamWeekTasks(tasks, now = Date.now()) {
  const n = new Date(now);
  const startOfWeek = new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7)).getTime();
  const DAY = 86400000;
  const endOfWeek = startOfWeek + 7 * DAY - 1;      // domingo 23:59:59.999
  const endOfNextWeek = startOfWeek + 14 * DAY - 1; // domingo siguiente
  const doneFrom = startOfWeek - 7 * DAY;           // lunes de la semana pasada

  const out = [];
  const visit = (t, parent) => {
    const base = parent ? { ...t, isSubtask: true, parentName: parent.name } : t;
    if (isOpen(t)) {
      if (t.dueDate && t.dueDate <= endOfWeek) out.push({ ...base, bucket: "activa" });
      else if (t.dueDate && t.dueDate <= endOfNextWeek) out.push({ ...base, bucket: "siguiente" });
    } else if (t.dateDone && t.dateDone >= doneFrom) {
      out.push({ ...base, bucket: "completada" });
    }
    for (const s of t.subtasks ?? []) visit(s, t);
  };
  for (const t of tasks) visit(t, null);

  // Orden cronológico: completadas (la más reciente al final) → activas →
  // semana siguiente, estas dos por vencimiento.
  const ORDER = { completada: 0, activa: 1, siguiente: 2 };
  return out.sort((a, b) => {
    if (a.bucket !== b.bucket) return ORDER[a.bucket] - ORDER[b.bucket];
    if (a.bucket === "completada") return (a.dateDone ?? 0) - (b.dateDone ?? 0);
    return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);
  });
}

// Tareas abiertas (de todo el equipo) para el espacio de gestión.
export function openTasks(tasks) {
  return tasks.filter((t) => isOpen(t));
}

// Próximas (con fecha futura) de una persona, para contexto.
export function upcomingTasks(tasks, email, now = Date.now()) {
  const limit = endOfToday(now);
  return tasks
    .filter((t) => isOpen(t) && assignedTo(t, email) && t.dueDate && t.dueDate > limit)
    .sort((a, b) => a.dueDate - b.dueDate);
}

// Resumen general del workspace para el "estado de todo".
export function workspaceOverview(tasks, now = Date.now()) {
  const limit = endOfToday(now);
  const withDue = tasks.filter((t) => isOpen(t) && t.dueDate);
  return {
    total: tasks.length,
    overdue: withDue.filter((t) => t.dueDate < now).length,
    dueToday: withDue.filter((t) => t.dueDate >= now && t.dueDate <= limit).length,
  };
}

/**
 * Sprints y proyectos temporales (campañas) EN CURSO, con su progreso.
 * Un bloque por lista marcada `is_sprint` o `is_campaign` en el admin.
 *
 * Se considera EN CURSO si ya empezó (o no tiene inicio) y además no está
 * terminado: sigue dentro de plazo, o se pasó de fecha pero le quedan tareas
 * abiertas (retrasado). Los que aún no han empezado y los cerrados se caen.
 *
 * `pct` mide trabajo hecho, no tiempo transcurrido: es lo que interesa para
 * saber cómo va. Las tareas en proceso cuentan medio punto, así que el sprint
 * avanza en cuanto se empieza a mover, no solo al cerrar. `elapsedPct` sí es
 * el tiempo, para contrastar «vas por el 30% con el 80% del plazo gastado».
 */
export function activeSprints(lists = [], tasks = [], now = Date.now()) {
  const today = endOfToday(now);
  const startToday = new Date(now).setHours(0, 0, 0, 0);
  const out = [];

  // El color se elige por CLIENTE (carpeta), y puede estar guardado en
  // cualquiera de sus listas: hay que buscarlo en todas, no solo en la del
  // sprint. Mismo criterio que el calendario y el área de tareas.
  const colorsByClient = Object.fromEntries(
    lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color])
  );

  for (const l of lists) {
    if (!l.visible || (!l.is_sprint && !l.is_campaign)) continue;
    // Aún no ha arrancado → no es "activo".
    if (l.list_start && l.list_start > today) continue;

    const items = tasks.filter((t) => t.listId === l.list_id);
    const total = items.length;
    const open = items.filter(isOpen);
    const done = total - open.length;
    const overdue = open.filter((t) => t.dueDate && t.dueDate < startToday).length;
    // Las que ya se están moviendo: en ClickUp los estados intermedios
    // ("en progreso", "revisión"…) son de tipo `custom`; `open` es el "pendiente"
    // inicial. Cuentan medio punto en el progreso: no están hechas, pero
    // tampoco sin empezar.
    const doing = open.filter((t) => t.statusType === "custom").length;

    // Pasado de fecha y sin nada abierto → terminado, fuera.
    const pastDue = Boolean(l.list_due && l.list_due < startToday);
    if (pastDue && open.length === 0) continue;
    // Sin fechas y sin tareas no aporta nada.
    if (!l.list_start && !l.list_due && total === 0) continue;

    // Días restantes contando DÍAS DE CALENDARIO (no horas sueltas): si vence
    // mañana debe decir 1, no 2. Se compara el día del vencimiento con hoy.
    const daysLeft = l.list_due
      ? Math.round((new Date(l.list_due).setHours(0, 0, 0, 0) - startToday) / DAY)
      : null;
    // % de plazo consumido (solo si hay rango completo y con sentido).
    let elapsedPct = null;
    if (l.list_start && l.list_due && l.list_due > l.list_start) {
      elapsedPct = Math.min(100, Math.max(0, ((now - l.list_start) / (l.list_due - l.list_start)) * 100));
    }

    out.push({
      id: l.list_id,
      name: l.list_name,
      client: l.folder_name ?? null,
      kind: l.is_sprint ? "sprint" : "campaign",
      // Color elegido en admin para el cliente (buscado en todas sus listas, no
      // solo en ésta); si no hay, la UI lo deriva del nombre.
      colorKey: (l.folder_name && colorsByClient[l.folder_name]) || l.color || null,
      note: (l.list_content || "").trim() || null,
      start: l.list_start ?? null,
      due: l.list_due ?? null,
      total,
      done,
      doing,
      active: open.length,
      overdue,
      // Hecho = 1 punto, en proceso = medio punto, pendiente = 0.
      pct: total ? ((done + doing * 0.5) / total) * 100 : 0,
      elapsedPct,
      daysLeft,
      pastDue,
    });
  }

  // Los que acaban antes primero; los retrasados arriba del todo; sin fecha al final.
  return out.sort(
    (a, b) =>
      (b.pastDue ? 1 : 0) - (a.pastDue ? 1 : 0) ||
      (a.due ?? Infinity) - (b.due ?? Infinity) ||
      a.name.localeCompare(b.name, "es")
  );
}

// ── Mock (sin token) — fechas relativas a hoy para que la UI tenga vida ─────
const now = Date.now();
const MOCK_TASKS = [
  { id: "m1", name: "Revisar wireframes onboarding", url: "#", status: "en progreso", statusColor: "#3B82F6", listName: "Portal interno", dueDate: now - DAY, assignees: [{ email: "alvaro@fcts.studio", name: "Álvaro", initials: "Á", color: "#1F1F1E" }] },
  { id: "m2", name: "Copys campaña julio", url: "#", status: "pendiente", statusColor: "#B07A1F", listName: "TradingLab", dueDate: now + 3 * 3600000, assignees: [{ email: "alba@fcts.studio", name: "Alba", initials: "A", color: "#386E9E" }] },
  { id: "m3", name: "Programar posts semana", url: "#", status: "pendiente", statusColor: "#B07A1F", listName: "Redes", dueDate: now + 6 * 3600000, assignees: [{ email: "carla@fcts.studio", name: "Carla", initials: "C", color: "#8A5CB0" }] },
  { id: "m4", name: "Maquetar componente agenda", url: "#", status: "en progreso", statusColor: "#3B82F6", listName: "Portal interno", dueDate: now + DAY, assignees: [{ email: "carles@fcts.studio", name: "Carles", initials: "C", color: "#B07A1F" }] },
  { id: "m5", name: "Roadmap Q3 producto", url: "#", status: "pendiente", statusColor: "#B07A1F", listName: "Producto", dueDate: now + 2 * DAY, assignees: [{ email: "lucas@fcts.studio", name: "Lucas", initials: "L", color: "#3F7A3A" }] },
  { id: "m6", name: "Assets ilustración landing", url: "#", status: "pendiente", statusColor: "#B07A1F", listName: "Brand", dueDate: now - 2 * DAY, assignees: [{ email: "mariola@fcts.studio", name: "Mariola", initials: "M", color: "#386E9E" }] },
];
