import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, getCurrentEmployee } from "./helpers";
import { monthEndISO } from "@/lib/dates";

// Todos los empleados (incluidos inactivos) para el panel de RR.HH.
export async function getAllEmployees() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, email, role, photo, color, birthday, manager_id, is_admin, vacation_allowance, active")
    .order("name");
  return data ?? [];
}

// Solicitudes de vacaciones pendientes (todas), con nombre del solicitante.
export async function getPendingVacations() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacation_requests")
    .select("id, start_date, end_date, working_days, note, created_at, employee_id")
    .eq("status", "pending")
    .order("start_date");
  return data ?? [];
}

// Últimas solicitudes resueltas (aprobadas/rechazadas/canceladas).
export async function getRecentDecided(limit = 20) {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacation_requests")
    .select("id, start_date, end_date, working_days, status, employee_id, decided_at")
    .neq("status", "pending")
    .order("decided_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Estadísticas de fichaje del mes por empleado: nº de jornadas y cuántas
// pendientes de validar.
export async function getTimeMonthStats(month) {
  if (!isConfigured()) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("employee_id, status")
    .eq("voided", false)
    .gte("work_date", `${month}-01`)
    .lte("work_date", monthEndISO(month));
  const out = {};
  for (const e of data ?? []) {
    const s = (out[e.employee_id] ||= { total: 0, pending: 0 });
    s.total++;
    if (e.status !== "validated") s.pending++;
  }
  return out;
}

// Suma de días de vacaciones aprobadas por empleado en un año (para el saldo).
export async function getApprovedVacationDays(year) {
  if (!isConfigured()) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacation_requests")
    .select("employee_id, working_days, start_date")
    .eq("status", "approved")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`);
  const out = {};
  for (const v of data ?? []) out[v.employee_id] = (out[v.employee_id] || 0) + Number(v.working_days);
  return out;
}

export { getCurrentEmployee };
