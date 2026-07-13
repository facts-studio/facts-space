import "server-only";
import { createClient } from "@/lib/supabase/server";
import { EVENTS as MOCK_EVENTS } from "@/lib/mock";
import { isConfigured } from "./helpers";
import { getAgendaEvents, getClickUpMilestones } from "./clickup";

// Eventos unificados para el calendario, en el MISMO shape que consume
// CalendarMonth/TodayHero/equipo: { id, type, title, start, end, who }.
// Fuentes:
//  · Vacaciones/ausencias → intranet (vacation_requests aprobadas). La intranet
//    es la fuente; al aprobar se espeja a la lista Vacaciones de ClickUp.
//  · Festivos, cumpleaños e hitos de empresa → ClickUp (Agenda F*cts).
//  · Hitos a nivel de tarea (milestones, cualquier lista) → ClickUp.
// Fallback al mock cuando no hay Supabase configurado.
export async function getCalendarEvents() {
  if (!isConfigured()) return MOCK_EVENTS;

  const supabase = await createClient();
  const [vac, emps, agenda, milestones] = await Promise.all([
    supabase
      .from("vacation_requests")
      .select("id, start_date, end_date, note, employee_id, type")
      .eq("status", "approved"),
    supabase.from("employees").select("id, name"),
    getAgendaEvents(),        // festivos + cumpleaños + hitos de empresa (ClickUp)
    getClickUpMilestones(),   // hitos a nivel de tarea (milestones, cualquier lista)
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

  // Agenda de empresa (festivos, cumpleaños, hitos) + hitos a nivel de tarea.
  for (const e of agenda ?? []) events.push(e);
  for (const m of milestones ?? []) events.push(m);

  return events;
}
