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
  if ("vacation_adjustment" in patch) allowed.vacation_adjustment = Number(patch.vacation_adjustment) || 0;
  if ("is_admin" in patch) allowed.is_admin = Boolean(patch.is_admin);
  if ("active" in patch) allowed.active = Boolean(patch.active);
  if ("role" in patch) allowed.role = String(patch.role);
  // Datos base
  if ("name" in patch) allowed.name = String(patch.name ?? "").trim();
  if ("email" in patch) allowed.email = String(patch.email ?? "").trim().toLowerCase();
  if ("photo" in patch) allowed.photo = String(patch.photo ?? "");
  if ("birthday" in patch) allowed.birthday = patch.birthday || null;
  // Ficha laboral + datos legales completos
  for (const k of [
    "dni", "nss", "iban", "phone", "address", "emergency_contact", "contract_type",
    "last_name", "nationality", "gender", "marital_status", "id_doc_type",
    "mobile", "city", "postal_code", "province", "country", "bank_name", "swift",
  ]) {
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
  revalidatePath("/calendario");
  return { ok: true };
}

// Alta de un empleado nuevo. Se vincula al usuario cuando entra con su email.
export async function createEmployee({ name, email, role = "" }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  const n = String(name ?? "").trim();
  const em = String(email ?? "").trim().toLowerCase();
  if (!n || !em) return { ok: false, error: "Nombre y email son obligatorios." };
  if (!em.includes("@")) return { ok: false, error: "Email no válido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({ name: n, email: em, role: String(role ?? ""), active: true, is_admin: false, vacation_allowance: 22 })
    .select("id")
    .single();
  if (error) {
    const dup = /duplicate|unique/i.test(error.message) ? "Ya existe un empleado con ese email." : error.message;
    return { ok: false, error: dup };
  }
  revalidatePath("/admin");
  revalidatePath("/equipo");
  return { ok: true, id: data.id };
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
