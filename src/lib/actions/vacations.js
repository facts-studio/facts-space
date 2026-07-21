"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { workingDaysBetween, eachDayISO } from "@/lib/dates";
import { getAgendaEvents } from "@/lib/data/clickup";
import { createVacationTask, updateVacationTask, deleteVacationTask } from "@/lib/clickup-vacations";

// Título de la tarea espejo en ClickUp según el tipo de ausencia.
const ABS_TITLE = { vacaciones: "Vacaciones", baja: "Baja", permiso: "Permiso", asuntos_propios: "Asuntos propios", teletrabajo: "Teletrabajo", otro: "Ausencia" };

// Lee el id de la tarea de ClickUp espejo (best-effort; si la columna aún no
// existe —migración sin ejecutar— devuelve null sin romper el flujo).
async function mirrorTaskId(supabase, id) {
  const { data } = await supabase.from("vacation_requests").select("clickup_task_id").eq("id", id).maybeSingle();
  return data?.clickup_task_id ?? null;
}

// Festivos (ISO) para descontarlos del cómputo de días laborables. Fuente:
// lista Festivos de la Agenda F*cts en ClickUp (rangos expandidos a días).
async function getFestivos() {
  const agenda = await getAgendaEvents();
  const days = [];
  for (const e of agenda) if (e.type === "festivo") days.push(...eachDayISO(e.start, e.end));
  return days;
}

// Solicitar una ausencia (queda 'pending' hasta que el manager/admin decida).
// type: vacaciones | baja | permiso | asuntos_propios | teletrabajo | otro.
export async function requestVacation({ startDate, endDate, note = "", type = "vacaciones" }) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  if (!startDate) return { ok: false, error: "Falta la fecha de inicio." };
  const end = endDate || startDate;
  if (end < startDate) return { ok: false, error: "La fecha de fin es anterior al inicio." };

  const supabase = await createClient();
  const wd = workingDaysBetween(startDate, end, await getFestivos());
  if (wd <= 0) return { ok: false, error: "Ese rango no tiene días laborables (findes/festivos)." };

  // Saldo de vacaciones: no dejar solicitar más días de los que quedan (solo
  // aplica a type=vacaciones; bajas/permisos no descuentan del saldo).
  if (type === "vacaciones") {
    const startYear = startDate.slice(0, 4);
    const allowance = Number(me.vacation_allowance ?? 0) + Number(me.vacation_adjustment ?? 0);
    const { data: existing } = await supabase
      .from("vacation_requests")
      .select("working_days, start_date, status")
      .eq("employee_id", me.id)
      .eq("type", "vacaciones")
      .in("status", ["approved", "pending"]);
    const used = (existing ?? [])
      .filter((v) => (v.start_date || "").slice(0, 4) === startYear)
      .reduce((s, v) => s + Number(v.working_days || 0), 0);
    const remaining = allowance - used;
    if (wd > remaining) {
      return {
        ok: false,
        error: remaining <= 0
          ? `No te quedan días de vacaciones para ${startYear}.`
          : `Solo te quedan ${remaining} día${remaining === 1 ? "" : "s"} de vacaciones y estás pidiendo ${wd}.`,
      };
    }
  }

  // Sin responsable (manager) → se aprueba automáticamente, no hay quien decida.
  const autoApprove = !me.manager_id;

  // El alta va SIEMPRE como "pending": la política RLS `vacation_insert` solo
  // admite ese estado. Si no hay responsable, se aprueba justo después con un
  // update (que sí permite al dueño cambiar su solicitud). Insertar
  // directamente como "approved" reventaba con "violates row-level security"
  // a quien no tiene manager (los admins).
  const { data: inserted, error } = await supabase.from("vacation_requests").insert({
    employee_id: me.id,
    start_date: startDate,
    end_date: end,
    working_days: wd,
    note: note.trim(),
    type,
    status: "pending",
  }).select("id").single();
  if (error) return { ok: false, error: error.message };

  if (autoApprove) {
    const { error: appErr } = await supabase
      .from("vacation_requests")
      .update({ status: "approved", decided_by: me.id, decided_at: new Date().toISOString() })
      .eq("id", inserted.id);
    if (appErr) return { ok: false, error: appErr.message };
  }

  // Espejo en ClickUp (Agenda › Vacaciones). Best-effort.
  const title = `${ABS_TITLE[type] ?? "Ausencia"} ${me.name}`.trim();
  const taskId = await createVacationTask({ title, startISO: startDate, endISO: end, personName: me.name, approved: autoApprove });
  if (taskId) await supabase.from("vacation_requests").update({ clickup_task_id: taskId }).eq("id", inserted.id);

  revalidatePath("/calendario");
  revalidatePath("/mi-espacio");
  return { ok: true, workingDays: wd, autoApproved: autoApprove };
}

// Marca como vistas MIS decisiones (aviso de Inicio descartado). Sin ids, marca
// todas las pendientes de ver. Acotado a employee_id además de la RLS.
export async function markDecisionsSeen(ids = []) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();
  let q = supabase
    .from("vacation_requests")
    .update({ decision_seen_at: new Date().toISOString() })
    .eq("employee_id", me.id);
  q = ids.length ? q.in("id", ids) : q.in("status", ["approved", "rejected"]).is("decision_seen_at", null);
  const { error } = await q;
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

// Mis ausencias (todas, recientes primero).
export async function getMyRequests() {
  const me = await getCurrentEmployee();
  if (!me) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacation_requests")
    .select("id, type, start_date, end_date, working_days, status, note, created_at")
    .eq("employee_id", me.id)
    .order("start_date", { ascending: false });
  return data ?? [];
}

// Cancelar una solicitud propia que siga pendiente.
export async function cancelVacation(id) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();
  const taskId = await mirrorTaskId(supabase, id);
  const { error } = await supabase
    .from("vacation_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("employee_id", me.id)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  if (taskId) await deleteVacationTask(taskId); // cancelada → borra la tarea espejo
  revalidatePath("/calendario");
  revalidatePath("/vacaciones");
  return { ok: true };
}

// Cambiar el estado de una solicitud a posteriori (manager del solicitante o admin).
export async function setVacationStatus({ id, status }) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  if (!["pending", "approved", "rejected", "cancelled"].includes(status)) return { ok: false, error: "Estado inválido." };
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("vacation_requests")
    .select("employee_id, employees:employee_id(manager_id)")
    .eq("id", id)
    .maybeSingle();
  if (!req) return { ok: false, error: "Solicitud no encontrada." };
  if (req.employees?.manager_id !== me.id && !me.is_admin) return { ok: false, error: "Sin permiso." };

  // decision_seen_at a null: si se resuelve (o se revierte a pendiente), el
  // solicitante vuelve a recibir el aviso.
  const patch = { status, decision_seen_at: null };
  if (status === "approved" || status === "rejected") { patch.decided_by = me.id; patch.decided_at = new Date().toISOString(); }
  else { patch.decided_by = null; patch.decided_at = null; }
  const { error } = await supabase.from("vacation_requests").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Espejo ClickUp: aprobada/pendiente → actualiza estado; rechazada/cancelada → borra.
  const taskId = await mirrorTaskId(supabase, id);
  if (taskId) {
    if (status === "approved") await updateVacationTask(taskId, { approved: true });
    else if (status === "pending") await updateVacationTask(taskId, { approved: false });
    else { await deleteVacationTask(taskId); await supabase.from("vacation_requests").update({ clickup_task_id: null }).eq("id", id); }
  }

  revalidatePath("/admin");
  revalidatePath("/calendario");
  revalidatePath("/mi-espacio");
  return { ok: true };
}

// Eliminar una solicitud (manager del solicitante o admin).
export async function deleteVacation(id) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("vacation_requests")
    .select("employee_id, employees:employee_id(manager_id)")
    .eq("id", id)
    .maybeSingle();
  if (!req) return { ok: false, error: "Solicitud no encontrada." };
  if (req.employees?.manager_id !== me.id && !me.is_admin) return { ok: false, error: "Sin permiso." };
  const taskId = await mirrorTaskId(supabase, id);
  const { error } = await supabase.from("vacation_requests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (taskId) await deleteVacationTask(taskId); // eliminada → borra la tarea espejo
  revalidatePath("/admin");
  revalidatePath("/calendario");
  revalidatePath("/mi-espacio");
  return { ok: true };
}

// Decidir (aprobar/rechazar) una solicitud de un reporte directo. La RLS ya
// impide decidir solicitudes que no sean de tu equipo; aquí revalidamos además
// que somos el manager o admin.
export async function decideVacation({ id, approve, decisionNote = "" }) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("vacation_requests")
    .select("id, employee_id, status, employees:employee_id(manager_id)")
    .eq("id", id)
    .maybeSingle();
  if (!req) return { ok: false, error: "Solicitud no encontrada." };
  const isManager = req.employees?.manager_id === me.id;
  if (!isManager && !me.is_admin) return { ok: false, error: "No puedes decidir esta solicitud." };
  if (req.status !== "pending") return { ok: false, error: "La solicitud ya estaba resuelta." };

  const { error } = await supabase
    .from("vacation_requests")
    .update({
      status: approve ? "approved" : "rejected",
      decided_by: me.id,
      decided_at: new Date().toISOString(),
      decision_note: decisionNote.trim(),
      decision_seen_at: null, // vuelve a avisar al solicitante
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Espejo ClickUp: aprobar → estado 'aprobada'; rechazar → borra la tarea.
  const taskId = await mirrorTaskId(supabase, id);
  if (taskId) {
    if (approve) await updateVacationTask(taskId, { approved: true });
    else { await deleteVacationTask(taskId); await supabase.from("vacation_requests").update({ clickup_task_id: null }).eq("id", id); }
  }

  revalidatePath("/calendario");
  revalidatePath("/vacaciones");
  return { ok: true };
}
