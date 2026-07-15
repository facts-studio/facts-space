import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, getCurrentEmployee } from "./helpers";
import { madridDateISO } from "@/lib/dates";

// Mis solicitudes ya resueltas (aprobadas/rechazadas) que aún no he visto.
// Alimentan el aviso de Inicio; se marcan vistas al descartarlo.
export async function getMyDecisions() {
  if (!isConfigured()) return [];
  const me = await getCurrentEmployee();
  if (!me) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vacation_requests")
    .select("id, type, start_date, end_date, status, decision_note")
    .eq("employee_id", me.id)
    .in("status", ["approved", "rejected"])
    .is("decision_seen_at", null)
    .order("decided_at", { ascending: false });
  if (error) return []; // columna aún sin migrar → sin avisos, no rompe Inicio
  return data ?? [];
}

// Resumen personal para "Mi espacio": saldo de vacaciones del año y próximas
// ausencias aprobadas.
export async function getMyOverview(employee) {
  if (!isConfigured() || !employee) return null;
  const supabase = await createClient();
  const year = Number(madridDateISO().slice(0, 4));
  const today = madridDateISO();

  const [vacR, upR] = await Promise.all([
    supabase
      .from("vacation_requests")
      .select("working_days")
      .eq("employee_id", employee.id)
      .eq("status", "approved")
      .eq("type", "vacaciones")
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`),
    supabase
      .from("vacation_requests")
      .select("start_date, end_date, working_days")
      .eq("employee_id", employee.id)
      .eq("status", "approved")
      .eq("type", "vacaciones")
      .gte("end_date", today)
      .order("start_date")
      .limit(5),
  ]);

  const used = (vacR.data ?? []).reduce((s, v) => s + Number(v.working_days), 0);
  const allowance = Number(employee.vacation_allowance) + Number(employee.vacation_adjustment || 0);
  return {
    year,
    allowance,
    used,
    remaining: allowance - used,
    upcoming: upR.data ?? [],
  };
}
