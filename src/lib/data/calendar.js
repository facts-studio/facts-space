import "server-only";
import { createClient } from "@/lib/supabase/server";
import { EVENTS as MOCK_EVENTS } from "@/lib/mock";
import { isConfigured } from "./helpers";

// Eventos unificados para el calendario, en el MISMO shape que consume
// CalendarMonth/TodayHero/equipo: { id, type, title, start, end, who }.
// Fuentes: vacaciones aprobadas + cumpleaños (de birthday) + festivos + hitos.
// Fallback al mock cuando no hay Supabase configurado.
export async function getCalendarEvents() {
  if (!isConfigured()) return MOCK_EVENTS;

  const supabase = await createClient();
  const [vac, emps, cal] = await Promise.all([
    supabase
      .from("vacation_requests")
      .select("id, start_date, end_date, note, employee_id, type")
      .eq("status", "approved"),
    supabase.from("employees").select("id, name, birthday, active"),
    supabase.from("calendar_events").select("id, type, title, start_date, end_date"),
  ]);

  // Nombre por id (vacation_requests tiene 2 FKs a employees → no usamos embed).
  const nameById = new Map((emps.data ?? []).map((m) => [m.id, m.name]));

  const events = [];

  const ABS_LABEL = { vacaciones: "Vacaciones", baja: "Baja", permiso: "Permiso", asuntos_propios: "Asuntos propios", teletrabajo: "Teletrabajo", otro: "Ausencia" };
  for (const v of vac.data ?? []) {
    const who = nameById.get(v.employee_id) ?? null;
    const isVac = (v.type ?? "vacaciones") === "vacaciones";
    events.push({
      id: `vac-${v.id}`,
      type: isVac ? "vacaciones" : "ausencia",
      title: v.note?.trim() || `${ABS_LABEL[v.type] ?? "Ausencia"} ${who ?? ""}`.trim(),
      start: v.start_date,
      end: v.end_date,
      who,
    });
  }

  for (const e of cal.data ?? []) {
    events.push({
      id: `cal-${e.id}`,
      type: e.type, // 'festivo' | 'hito'
      title: e.title,
      start: e.start_date,
      end: e.end_date,
      who: null,
    });
  }

  // Cumpleaños: derivados de birthday, proyectados al año actual y al siguiente
  // (el calendario navega por años).
  const years = [new Date().getFullYear(), new Date().getFullYear() + 1];
  for (const m of emps.data ?? []) {
    if (!m.birthday || m.active === false) continue;
    const md = m.birthday.slice(5); // "MM-DD"
    for (const y of years) {
      const d = `${y}-${md}`;
      events.push({
        id: `cum-${m.id}-${y}`,
        type: "cumple",
        title: `Cumpleaños ${m.name}`,
        start: d,
        end: d,
        who: m.name,
      });
    }
  }

  return events;
}
