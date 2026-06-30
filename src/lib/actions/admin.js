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

  const supabase = await createClient();
  const { error } = await supabase.from("employees").update(allowed).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/equipo");
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
