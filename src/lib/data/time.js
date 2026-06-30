import "server-only";
import { createClient } from "@/lib/supabase/server";
import { eachDayISO } from "@/lib/dates";
import { isConfigured } from "./helpers";

// Fichajes (no anulados) de un empleado en un rango de work_date [from, to] ISO.
export async function getTimeEntries(employeeId, fromISO, toISO) {
  if (!isConfigured() || !employeeId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out, work_date, source, status")
    .eq("employee_id", employeeId)
    .eq("voided", false)
    .gte("work_date", fromISO)
    .lte("work_date", toISO)
    .order("clock_in");
  return data ?? [];
}

// Marcas del calendario en [from, to]: festivos (todos) y vacaciones aprobadas
// del empleado, como listas de días ISO.
export async function getDayMarks(employee, fromISO, toISO) {
  if (!isConfigured() || !employee) return { festivos: [], vacaciones: [] };
  const supabase = await createClient();
  const [fesR, vacR] = await Promise.all([
    supabase.from("calendar_events").select("start_date, end_date").eq("type", "festivo").lte("start_date", toISO).gte("end_date", fromISO),
    supabase.from("vacation_requests").select("start_date, end_date").eq("employee_id", employee.id).eq("status", "approved").lte("start_date", toISO).gte("end_date", fromISO),
  ]);
  const festivos = [];
  for (const f of fesR.data ?? []) for (const { iso } of eachDayISO(f.start_date, f.end_date)) if (iso >= fromISO && iso <= toISO) festivos.push(iso);
  const vacaciones = [];
  for (const v of vacR.data ?? []) for (const { iso } of eachDayISO(v.start_date, v.end_date)) if (iso >= fromISO && iso <= toISO) vacaciones.push(iso);
  return { festivos, vacaciones };
}

// Días laborables sin fichar en [from, to]: excluye findes, festivos, el
// cumpleaños de la persona, sus vacaciones aprobadas y los días ya fichados.
export async function getMissingWorkdays(employee, fromISO, toISO) {
  if (!isConfigured() || !employee) return [];
  const supabase = await createClient();
  const [fesR, vacR, entR] = await Promise.all([
    supabase.from("calendar_events").select("start_date, end_date").eq("type", "festivo"),
    supabase.from("vacation_requests").select("start_date, end_date").eq("employee_id", employee.id).eq("status", "approved"),
    supabase.from("time_entries").select("work_date").eq("employee_id", employee.id).eq("voided", false).gte("work_date", fromISO).lte("work_date", toISO),
  ]);

  const fset = new Set();
  for (const f of fesR.data ?? []) for (const { iso } of eachDayISO(f.start_date, f.end_date)) fset.add(iso);
  const vset = new Set();
  for (const v of vacR.data ?? []) for (const { iso } of eachDayISO(v.start_date, v.end_date)) vset.add(iso);
  const have = new Set((entR.data ?? []).map((e) => e.work_date));
  const bday = employee.birthday ? employee.birthday.slice(5) : null;

  const out = [];
  for (const { iso, dow } of eachDayISO(fromISO, toISO)) {
    if (dow === 0 || dow === 6) continue;
    if (fset.has(iso) || vset.has(iso) || have.has(iso)) continue;
    if (bday && iso.slice(5) === bday) continue;
    out.push(iso);
  }
  return out;
}
