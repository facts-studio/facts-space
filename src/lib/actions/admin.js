"use server";

import { revalidatePath } from "next/cache";
import { getSlackUsers } from "@/lib/data/slack";
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
  if ("clickup_group_id" in patch) allowed.clickup_group_id = patch.clickup_group_id || null;
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
    "mobile", "city", "postal_code", "province", "country", "bank_name", "swift", "personal_email",
    "work_schedule", "work_mode",
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

// Activa o desactiva un empleado (baja blanda: se conserva su ficha e historial,
// deja de contar en fichaje/informes/calendario). Para bajas, despidos, etc.
export async function setEmployeeActive({ id, active }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  if (id === me.id && !active) return { ok: false, error: "No puedes desactivarte a ti mismo." };
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ active: Boolean(active) }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/equipo");
  revalidatePath("/calendario");
  return { ok: true };
}

// Vincula (o desvincula, con groupId vacío) un empleado a un grupo/perfil de
// ClickUp. El id de grupo relaciona los eventos de ClickUp (cumpleaños…) con la
// ficha. Sin vínculo, el empleado no aparece en esas funciones del calendario.
export async function setEmployeeClickupGroup({ id, groupId }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ clickup_group_id: groupId || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/calendario");
  revalidatePath("/");
  return { ok: true };
}

// Vincula (o desvincula, con userId vacío) un empleado a su perfil de Slack.
// Con el vínculo, los tickets de los canales compartidos saben de quién son.
export async function setEmployeeSlackUser({ id, userId }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ slack_user_id: userId || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

// Vincula de golpe a quien se pueda casar por email con el directorio de Slack.
// Es lo que evita tener que emparejar a mano a toda la plantilla.
export async function autolinkSlackUsers() {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  const [users, supabase] = await Promise.all([getSlackUsers(), createClient()]);
  if (!users.length) return { ok: false, error: "Slack no está configurado o no devolvió usuarios." };
  const byEmail = new Map(users.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u.id]));

  const { data: employees } = await supabase
    .from("employees")
    .select("id, email, personal_email, slack_user_id")
    .is("slack_user_id", null);

  let linked = 0;
  for (const e of employees ?? []) {
    const match = byEmail.get((e.email || "").toLowerCase()) ?? byEmail.get((e.personal_email || "").toLowerCase());
    if (!match) continue;
    const { error } = await supabase.from("employees").update({ slack_user_id: match }).eq("id", e.id);
    if (!error) linked++;
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, linked, pending: (employees ?? []).length - linked };
}

// Borra un archivo/carpeta y su contenido de forma recursiva (best-effort). En
// Supabase Storage las "carpetas" son entradas con id === null.
async function removeStorageFolder(supabase, bucket, prefix) {
  const { data: entries, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !entries?.length) return;
  const files = [];
  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id === null) await removeStorageFolder(supabase, bucket, path); // subcarpeta
    else files.push(path);
  }
  if (files.length) await supabase.storage.from(bucket).remove(files);
}

// Elimina un empleado por completo. Las tablas hijas (ausencias, fichajes,
// documentos, notas) caen por ON DELETE CASCADE; manager_id de otros pasa a null.
// Además borramos sus archivos de Storage (nóminas/contratos/foto) por RGPD.
// Es destructivo e irreversible: la UI confirma antes de llamar.
export async function deleteEmployee({ id }) {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Solo administración." };
  if (id === me.id) return { ok: false, error: "No puedes eliminar tu propia cuenta." };

  const supabase = await createClient();
  // Limpieza de Storage antes del borrado (best-effort: no bloquea el DELETE).
  try {
    await removeStorageFolder(supabase, "hr-docs", id);
    await removeStorageFolder(supabase, "avatars", id);
  } catch { /* orphaned blobs are harmless; el borrado de la ficha es lo importante */ }

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/equipo");
  revalidatePath("/calendario");
  return { ok: true };
}

// Alta de un empleado nuevo. Se vincula al usuario cuando entra con su email.
// Color del avatar mientras no haya foto: estable a partir del email.
const AVATAR_COLORS = ["brand", "info", "warn", "violet", "success"];
function colorFor(email) {
  let h = 0;
  for (const ch of email) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

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
    .insert({ name: n, email: em, role: String(role ?? ""), color: colorFor(em), active: true, is_admin: false, vacation_allowance: 22 })
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
