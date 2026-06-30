"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { monthEndISO } from "@/lib/dates";

async function requireAdmin() {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) return null;
  return me;
}

// Actualiza campos de un empleado (manager, días/año, admin, activo, rol).
export async function updateEmployee({ id, patch }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };

  const allowed = {};
  if ("manager_id" in patch) allowed.manager_id = patch.manager_id || null;
  if ("vacation_allowance" in patch) allowed.vacation_allowance = Number(patch.vacation_allowance) || 0;
  if ("is_admin" in patch) allowed.is_admin = Boolean(patch.is_admin);
  if ("active" in patch) allowed.active = Boolean(patch.active);
  if ("role" in patch) allowed.role = String(patch.role);
  // Ficha laboral
  for (const k of ["dni", "nss", "iban", "phone", "address", "emergency_contact", "contract_type"]) {
    if (k in patch) allowed[k] = String(patch[k] ?? "");
  }
  if ("start_date" in patch) allowed.start_date = patch.start_date || null;
  if ("weekly_hours" in patch) allowed.weekly_hours = Number(patch.weekly_hours) || 0;
  if ("gross_salary" in patch) allowed.gross_salary = Number(patch.gross_salary) || 0;

  const supabase = await createClient();
  const { error } = await supabase.from("employees").update(allowed).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/equipo");
  return { ok: true };
}

// Calendario laboral: añadir festivo/hito.
export async function addCalendarEvent({ type = "festivo", title, startDate, endDate }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  if (!title || !startDate) return { ok: false, error: "Faltan título o fecha." };
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert({
    type, title: title.trim(), start_date: startDate, end_date: endDate || startDate,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function deleteCalendarEvent(id) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/calendario");
  return { ok: true };
}

// Marca como validados todos los fichajes pendientes de un empleado en un mes.
export async function validateMonth({ employeeId, month }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({ status: "validated" })
    .eq("employee_id", employeeId)
    .eq("voided", false)
    .eq("status", "pending")
    .gte("work_date", `${month}-01`)
    .lte("work_date", monthEndISO(month));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/fichaje");
  return { ok: true };
}
