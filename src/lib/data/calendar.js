import "server-only";
import { createClient } from "@/lib/supabase/server";
import { EVENTS as MOCK_EVENTS } from "@/lib/mock";
import { isConfigured } from "./helpers";
import { getAgendaEvents, getClickUpMilestones, getSprintEvents } from "./clickup";

const ABS_LABEL = { vacaciones: "Vacaciones", baja: "Baja", permiso: "Permiso", asuntos_propios: "Asuntos propios", teletrabajo: "Teletrabajo", otro: "Ausencia" };

// vacation_requests → evento del calendario. `pending` marca las solicitadas
// pero aún sin aprobar (se pintan con pastilla discontinua).
//
// OJO: la nota de la solicitud NO se trae aquí. Es un mensaje privado del
// solicitante a su responsable (se lee en Administrar › Aprobaciones), y las
// ausencias aprobadas las ve TODO el equipo: usarla de título la publicaría.
// El evento se registra siempre como "Vacaciones {nombre}" (o el tipo que sea).
function absenceToEvent(v, nameById) {
  const who = nameById.get(v.employee_id) ?? null;
  const isVac = (v.type ?? "vacaciones") === "vacaciones";
  return {
    id: `vac-${v.id}`,
    type: isVac ? "vacaciones" : "ausencia",
    title: `${ABS_LABEL[v.type] ?? "Ausencia"} ${who ?? ""}`.trim(),
    start: v.start_date,
    end: v.end_date,
    who,
    pending: v.status === "pending",
  };
}

/**
 * Ausencias SOLICITADAS pero aún sin aprobar, como eventos de calendario.
 * Va aparte de getCalendarEvents a propósito: esos eventos los consumen también
 * TodayHero ("hoy X está de vacaciones"), LoMasCercano y Equipo, que los tratan
 * como hechos — una solicitud sin aprobar no debe colarse ahí. Solo las usa
 * /calendario, que las pinta en discontinuo.
 *
 * La visibilidad la resuelve la RLS: una 'pending' solo la ven el solicitante,
 * su responsable y admin (las 'approved' las ve todo el equipo).
 */
export async function getPendingAbsenceEvents() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const [vac, emps] = await Promise.all([
    supabase
      .from("vacation_requests")
      .select("id, start_date, end_date, employee_id, type, status")
      .eq("status", "pending"),
    supabase.from("employees").select("id, name"),
  ]);
  const nameById = new Map((emps.data ?? []).map((m) => [m.id, m.name]));
  return (vac.data ?? []).map((v) => absenceToEvent(v, nameById));
}

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
  const [vac, emps, agenda, milestones, sprints] = await Promise.all([
    supabase
      .from("vacation_requests")
      .select("id, start_date, end_date, employee_id, type, status")
      .eq("status", "approved"),
    supabase.from("employees").select("id, name"),
    getAgendaEvents(),        // festivos + cumpleaños + hitos de empresa (ClickUp)
    getClickUpMilestones(),   // hitos a nivel de tarea (milestones, cualquier lista)
    getSprintEvents(),        // inicio y fin de las listas marcadas como sprint
  ]);

  // Nombre por id (vacation_requests tiene 2 FKs a employees → no usamos embed).
  const nameById = new Map((emps.data ?? []).map((m) => [m.id, m.name]));

  const events = [];

  for (const v of vac.data ?? []) events.push(absenceToEvent(v, nameById));

  // Agenda de empresa (festivos, cumpleaños, hitos) + hitos a nivel de tarea +
  // inicio/fin de los sprints.
  for (const e of agenda ?? []) events.push(e);
  for (const m of milestones ?? []) events.push(m);
  for (const s of sprints ?? []) events.push(s);

  return events;
}
