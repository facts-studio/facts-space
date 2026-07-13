import "server-only";
import { AGENDA_LISTS, isClickUpConfigured, getAgendaEvents } from "./data/clickup";
import { createAdminClient } from "./supabase/admin";
import { workingDaysBetween, eachDayISO } from "./dates";

// Espejo de vacaciones/ausencias de la intranet → lista "Vacaciones" de la
// Agenda F*cts en ClickUp. Best-effort: si algo falla, no rompe el flujo de la
// intranet (que es la fuente de verdad). Ver src/lib/actions/vacations.js.

const BASE = "https://api.clickup.com/api/v2";
const stripAccents = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// Fecha ISO (YYYY-MM-DD) → ms a mediodía UTC (evita desfase de día por zona).
const msFromISO = (iso) => Date.parse(`${iso}T12:00:00.000Z`);
// ms → ISO (YYYY-MM-DD) en horario de Madrid.
const msToISO = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(Number(ms)));

// Estados de la lista Vacaciones (ojo: "pendiende" tal cual está escrito en ClickUp).
const STATUS = { approved: "aprobada", pending: "pendiende" };

async function cu(path, method, body) {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: { Authorization: process.env.CLICKUP_API_TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ClickUp ${method} ${path} → ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// grupo (por nombre de pila) → id. Cacheado por instancia.
let _groups = null;
async function groupIdByName(name) {
  if (!_groups) {
    const json = await cu(`group?team_id=${process.env.CLICKUP_TEAM_ID}`, "GET");
    _groups = new Map((json.groups ?? []).map((g) => [stripAccents(g.name).split(" ")[0], g.id]));
  }
  return _groups.get(stripAccents(name).split(" ")[0]) ?? null;
}

// Crea la tarea de la ausencia. Devuelve el id de tarea o null.
export async function createVacationTask({ title, startISO, endISO, personName, approved }) {
  if (!isClickUpConfigured()) return null;
  try {
    const groupId = await groupIdByName(personName);
    const body = {
      name: title,
      status: approved ? STATUS.approved : STATUS.pending,
      start_date: msFromISO(startISO),
      start_date_time: false,
      due_date: msFromISO(endISO),
      due_date_time: false,
      ...(groupId ? { group_assignees: [groupId] } : {}),
    };
    const r = await cu(`list/${AGENDA_LISTS.vacaciones}/task`, "POST", body);
    return r?.id ?? null;
  } catch {
    return null;
  }
}

// Actualiza estado y/o fechas de la tarea espejo.
export async function updateVacationTask(taskId, { approved, startISO, endISO } = {}) {
  if (!taskId || !isClickUpConfigured()) return;
  try {
    const body = {};
    if (approved !== undefined) body.status = approved ? STATUS.approved : STATUS.pending;
    if (startISO) { body.start_date = msFromISO(startISO); body.start_date_time = false; }
    if (endISO) { body.due_date = msFromISO(endISO); body.due_date_time = false; }
    if (Object.keys(body).length) await cu(`task/${taskId}`, "PUT", body);
  } catch {
    /* best-effort */
  }
}

// Borra la tarea espejo (rechazo/cancelación/eliminación).
export async function deleteVacationTask(taskId) {
  if (!taskId || !isClickUpConfigured()) return;
  try {
    await cu(`task/${taskId}`, "DELETE");
  } catch {
    /* best-effort */
  }
}

// ── Sync de VUELTA: ClickUp → intranet (webhook) ────────────────────────────
// Reconcilia una solicitud existente con el estado actual de su tarea en ClickUp.
// Solo actúa sobre vacaciones creadas desde el portal (que tienen clickup_task_id).
const CU_STATUS = { aprobada: "approved", pendiende: "pending" };

async function festivoDates() {
  const agenda = await getAgendaEvents();
  const days = [];
  for (const e of agenda) if (e.type === "festivo") days.push(...eachDayISO(e.start, e.end));
  return days;
}

export async function reconcileVacationFromClickUp(taskId, { deleted = false } = {}) {
  const supabase = createAdminClient();
  if (!supabase || !taskId) return { ok: false, skipped: true };
  const { data: req } = await supabase
    .from("vacation_requests")
    .select("id, start_date, end_date, status")
    .eq("clickup_task_id", taskId)
    .maybeSingle();
  if (!req) return { ok: true, skipped: true }; // no es una vacación del portal

  if (deleted) {
    await supabase.from("vacation_requests").update({ status: "cancelled", clickup_task_id: null }).eq("id", req.id);
    return { ok: true, action: "cancelled" };
  }

  let task;
  try { task = await cu(`task/${taskId}`, "GET"); } catch { return { ok: false }; }
  const patch = {};
  const st = task?.status?.status ? stripAccents(task.status.status) : null;
  if (CU_STATUS[st] && CU_STATUS[st] !== req.status) patch.status = CU_STATUS[st];
  const startISO = task?.start_date ? msToISO(task.start_date) : null;
  const endISO = task?.due_date ? msToISO(task.due_date) : null;
  if (startISO && startISO !== req.start_date) patch.start_date = startISO;
  if (endISO && endISO !== req.end_date) patch.end_date = endISO;
  if (patch.start_date || patch.end_date) {
    patch.working_days = workingDaysBetween(patch.start_date || req.start_date, patch.end_date || req.end_date, await festivoDates());
  }
  if (Object.keys(patch).length) await supabase.from("vacation_requests").update(patch).eq("id", req.id);
  return { ok: true, action: Object.keys(patch).length ? "updated" : "nochange", patch };
}
