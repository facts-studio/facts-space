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

