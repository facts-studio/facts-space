"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { workingDaysBetween } from "@/lib/dates";

// Festivos (ISO) para descontarlos del cómputo de días laborables.
async function getFestivos(supabase) {
  const { data } = await supabase
    .from("calendar_events")
    .select("start_date")
    .eq("type", "festivo");
  return (data ?? []).map((f) => f.start_date);
}

// Solicitar vacaciones (queda en estado 'pending' hasta que el manager decida).
export async function requestVacation({ startDate, endDate, note = "" }) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  if (!startDate) return { ok: false, error: "Falta la fecha de inicio." };
  const end = endDate || startDate;
  if (end < startDate) return { ok: false, error: "La fecha de fin es anterior al inicio." };

  const supabase = await createClient();
  const wd = workingDaysBetween(startDate, end, await getFestivos(supabase));
  if (wd <= 0) return { ok: false, error: "Ese rango no tiene días laborables (findes/festivos)." };

  const { error } = await supabase.from("vacation_requests").insert({
    employee_id: me.id,
    start_date: startDate,
    end_date: end,
    working_days: wd,
    note: note.trim(),
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendario");
  revalidatePath("/vacaciones");
  return { ok: true, workingDays: wd };
}

// Cancelar una solicitud propia que siga pendiente.
export async function cancelVacation(id) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("vacation_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("employee_id", me.id)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/vacaciones");
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
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendario");
  revalidatePath("/vacaciones");
  return { ok: true };
}
