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
function assigneesFromGroups(t) {
  const gs = t.group_assignees;
  if (!Array.isArray(gs) || !gs.length) return null;
  return gs.map((g) => {
    const m = TEAM_BY_FIRST.get(stripAccents(g.name).split(" ")[0]);
    return { email: m?.email ?? null, name: m?.name ?? g.name, initials: (g.name?.[0] || "?").toUpperCase(), color: null };
  });
}

// Cliente/campaña desde el TAG. Mapa tag → nombre bonito (coincide con las
// claves de iconos/colores del admin). Devuelve null si no hay tag de cliente.
const CLIENT_TAGS = {
  "unfiltrade": "Unfiltrade", "tradinglab": "TradingLab", "flickflow": "Flickflow",
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
    priority: t.priority?.priority ?? null,
    dueDate: t.due_date ? Number(t.due_date) : null,
    startDate: t.start_date ? Number(t.start_date) : null,
    // Asignación: grupos (Equipo) → campo "Asignado a" → persona asignada real.
    assignees: assigneesFromGroups(t) ?? assigneesFromField(t) ?? (t.assignees ?? []).map((a) => ({
      email: a.email ?? null,
      name: a.username ?? a.email ?? "—",
      initials: a.initials ?? null,
      color: a.color ?? null,
    })),
  };
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

    if (visibleIds.length) {
      const raw = [];
      // Recorre páginas con unos parámetros extra dados.
      const fetchAll = async (extra) => {
        for (let page = 0; page < 30; page++) {
          const params = new URLSearchParams({ page: String(page), subtasks: "false", order_by: "due_date", ...extra });
          for (const id of visibleIds) params.append("list_ids[]", id);
          const res = await fetch(`${BASE}/team/${team}/task?${params}`, opts);
          if (!res.ok) break;
          const json = await res.json();
          const batch = json.tasks ?? [];
          raw.push(...batch);
          if (batch.length < 100) break;
        }
      };
      // 1) abiertas + 2) cerradas de los últimos 15 días (más allá no se traen).
      const cutoff = Date.now() - 15 * 86400000;
      await fetchAll({ include_closed: "false" });
      await fetchAll({ include_closed: "true", date_done_gt: String(cutoff) });
      // Dedup por id (una tarea puede venir en ambas si cambió de estado).
      const seen = new Set();
      const out = [];
      for (const t of raw) if (!seen.has(t.id)) { seen.add(t.id); out.push(mapTask(t)); }
      return out;
    }

    if (process.env.CLICKUP_VIEW_ID) {
      const out = [];
      for (let page = 0; page < 20; page++) {
        const res = await fetch(`${BASE}/view/${process.env.CLICKUP_VIEW_ID}/task?page=${page}`, opts);
        if (!res.ok) break;
        const json = await res.json();
        out.push(...(json.tasks ?? []).map(mapTask));
        if (json.last_page !== false) break;
      }
      return out;
    }

    const params = new URLSearchParams({ order_by: "due_date", subtasks: "false", include_closed: "false" });
    const res = await fetch(`${BASE}/team/${team}/task?${params}`, opts);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.tasks ?? []).map(mapTask);
  } catch {
    return [];
  }
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
  const push = (list, folder, space, statuses, sort) =>
    rows.push({
      list_id: list.id,
      list_name: list.name,
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

// ── Selectores (puros) ─────────────────────────────────────────────────────
const DAY = 86400000;
const endOfToday = (now = Date.now()) => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

const assignedTo = (t, email) => !email || t.assignees.some((a) => a.email === email);
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
export function weekTasks(tasks, email, now = Date.now()) {
  const horizon = new Date(now);
  horizon.setHours(23, 59, 59, 999);
  horizon.setDate(horizon.getDate() + 7);
  const limit = horizon.getTime();
  const mineOrUnowned = (t) =>
    (t.assignees?.length ?? 0) === 0 || (email && t.assignees.some((a) => a.email === email));
  return tasks
    .filter((t) => isOpen(t) && mineOrUnowned(t) && t.dueDate && t.dueDate <= limit)
    .sort((a, b) => a.dueDate - b.dueDate);
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
