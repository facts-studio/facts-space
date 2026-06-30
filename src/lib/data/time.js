import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "./helpers";

// Fichajes (no anulados) de un empleado en un rango de work_date [from, to] ISO.
export async function getTimeEntries(employeeId, fromISO, toISO) {
  if (!isConfigured() || !employeeId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out, work_date")
    .eq("employee_id", employeeId)
    .eq("voided", false)
    .gte("work_date", fromISO)
    .lte("work_date", toISO)
    .order("clock_in");
  return data ?? [];
}

// Jornada abierta (sin clock_out) del empleado, si la hay.
export async function getOpenEntry(employeeId) {
  if (!isConfigured() || !employeeId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id, clock_in")
    .eq("employee_id", employeeId)
    .is("clock_out", null)
    .eq("voided", false)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
