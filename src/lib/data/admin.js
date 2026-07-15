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
    .select("id, name, last_name, email, role, photo, color, birthday, manager_id, is_admin, vacation_allowance, vacation_adjustment, active")
    .order("name");
  return data ?? [];
}

// Solicitudes de vacaciones pendientes (todas), con nombre del solicitante.
// Solicitudes de ausencia pendientes que ME toca resolver: las de las personas
// a mi cargo (employees.manager_id) y, si soy admin, las de todo el equipo.
// Nunca las mías. Alimenta el aviso de Inicio.
export async function getPendingApprovals() {
  if (!isConfigured()) return [];
  const me = await getCurrentEmployee();
  if (!me) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vacation_requests")
    // Hay dos FKs a employees (employee_id y decided_by): hay que nombrar la relación.
    .select("id, start_date, end_date, working_days, type, employee_id, employees!vacation_requests_employee_id_fkey(name, manager_id)")
    .eq("status", "pending")
    .order("start_date");
  if (error) return [];
  return (data ?? [])
    .filter((r) => r.employee_id !== me.id && (me.is_admin || r.employees?.manager_id === me.id))
    .map((r) => ({
      id: r.id,
      name: r.employees?.name ?? "Alguien",
      type: r.type,
      start: r.start_date,
      end: r.end_date,
      days: r.working_days,
    }));
}

export async function getPendingVacations() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacation_requests")
    .select("id, start_date, end_date, working_days, note, created_at, employee_id, type")
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
    .select("id, start_date, end_date, working_days, status, employee_id, decided_at, type")
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
    .eq("type", "vacaciones")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`);
  const out = {};
  for (const v of data ?? []) out[v.employee_id] = (out[v.employee_id] || 0) + Number(v.working_days);
  return out;
}

// Ficha de un empleado por id.
export async function getEmployeeById(id) {
  if (!isConfigured() || !id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

// Solicitudes/ausencias de un empleado (recientes primero).
export async function getEmployeeRequests(employeeId) {
  if (!isConfigured() || !employeeId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacation_requests")
    .select("id, type, start_date, end_date, working_days, status, note, created_at")
    .eq("employee_id", employeeId)
    .order("start_date", { ascending: false });
  return data ?? [];
}

// Documentos de un empleado.
export async function getEmployeeDocuments(employeeId) {
  if (!isConfigured() || !employeeId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, employee_id, category, title, period, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// Fichajes de un empleado en un mes.
export async function getEmployeeTime(employeeId, month) {
  if (!isConfigured() || !employeeId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out, work_date, status")
    .eq("employee_id", employeeId)
    .eq("voided", false)
    .gte("work_date", `${month}-01`)
    .lte("work_date", monthEndISO(month))
    .order("clock_in");
  return data ?? [];
}

// Eventos del calendario laboral (festivos/hitos) del año, para gestionarlos.
export async function getCalendarManaged(year) {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("id, type, title, start_date, end_date")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`)
    .order("start_date");
  return data ?? [];
}

// Horas trabajadas (ms) por empleado en un mes.
export async function getTimeHoursByEmployee(month) {
  if (!isConfigured()) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("employee_id, clock_in, clock_out")
    .eq("voided", false)
    .gte("work_date", `${month}-01`)
    .lte("work_date", monthEndISO(month));
  const out = {};
  for (const e of data ?? []) {
    const ms = e.clock_out ? new Date(e.clock_out) - new Date(e.clock_in) : 0;
    out[e.employee_id] = (out[e.employee_id] || 0) + ms;
  }
  return out;
}

export { getCurrentEmployee };
