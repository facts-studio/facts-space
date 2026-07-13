import "server-only";
import { AGENDA_LISTS, isClickUpConfigured } from "./data/clickup";

// Espejo de vacaciones/ausencias de la intranet → lista "Vacaciones" de la
// Agenda F*cts en ClickUp. Best-effort: si algo falla, no rompe el flujo de la
// intranet (que es la fuente de verdad). Ver src/lib/actions/vacations.js.

const BASE = "https://api.clickup.com/api/v2";
const stripAccents = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// Fecha ISO (YYYY-MM-DD) → ms a mediodía UTC (evita desfase de día por zona).
const msFromISO = (iso) => Date.parse(`${iso}T12:00:00.000Z`);

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
