import "server-only";
import { createClient } from "@/lib/supabase/server";
import { EVENTS as MOCK_EVENTS } from "@/lib/mock";
import { isConfigured } from "./helpers";
import { getAgendaEvents, getClickUpMilestones, getSprintEvents } from "./clickup";
import { eachDayISO } from "@/lib/dates";

const ABS_LABEL = { vacaciones: "Vacaciones", baja: "Baja", permiso: "Permiso", asuntos_propios: "Asuntos propios", teletrabajo: "Teletrabajo", otro: "Ausencia" };

// ISO (YYYY-MM-DD) del día siguiente, sin tocar zonas horarias.
function isoNextDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

// ¿Entre dos tramos solo hay días no laborables? Un viernes y el lunes siguiente
// son la misma ausencia para quien la mira: nadie "vuelve" el sábado. Sin esto,
// unas vacaciones que cruzan el fin de semana se cuentan como dos.
function soloNoLaborables(desdeISO, hastaISO, festivos) {
  let cursor = isoNextDay(desdeISO);
  while (cursor < hastaISO) {
    const [y, m, d] = cursor.split("-").map(Number);
    const dow = new Date(y, m - 1, d).getDay(); // 0 domingo, 6 sábado
    if (dow !== 0 && dow !== 6 && !festivos.has(cursor)) return false;
    cursor = isoNextDay(cursor);
  }
  return true;
}

// Une ausencias contiguas o solapadas del MISMO empleado y tipo en un solo
// tramo. En la intranet una baja larga puede partirse en varias solicitudes
// (p. ej. 16→22 y 23→23); para el calendario es una sola ausencia 16→23.
// Los fines de semana y festivos intermedios no rompen el tramo.
function mergeAbsences(rows, festivos = new Set()) {
  const byKey = new Map();
  for (const r of rows) {
    const k = `${r.employee_id}|${r.type ?? "vacaciones"}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  }
  const out = [];
  for (const arr of byKey.values()) {
    arr.sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
    let cur = null;
    for (const r of arr) {
      // Contigua = empieza el día siguiente al fin del tramo actual (o antes),
      // o solo la separan días que nadie trabaja.
      const contigua =
        cur &&
        (r.start_date <= isoNextDay(cur.end_date) ||
          soloNoLaborables(cur.end_date, r.start_date, festivos));
      if (contigua) {
        if (r.end_date > cur.end_date) cur.end_date = r.end_date;
      } else {
        cur = { ...r };
        out.push(cur);
      }
    }
  }
  return out;
}

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
    supabase.from("employees").select("id, name, active"),
  ]);
  const activos = new Set((emps.data ?? []).filter((m) => m.active).map((m) => m.id));
  const nameById = new Map((emps.data ?? []).map((m) => [m.id, m.name]));
  // Los empleados desactivados (bajas/despidos) no pintan ausencias.
  const rows = (vac.data ?? []).filter((v) => activos.has(v.employee_id));
  return mergeAbsences(rows).map((v) => absenceToEvent(v, nameById));
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
    supabase.from("employees").select("id, name, active, clickup_group_id"),
    getAgendaEvents(),        // festivos + cumpleaños + hitos de empresa (ClickUp)
    getClickUpMilestones(),   // hitos a nivel de tarea (milestones, cualquier lista)
    getSprintEvents(),        // inicio y fin de las listas marcadas como sprint
  ]);

  // Nombre por id (vacation_requests tiene 2 FKs a employees → no usamos embed).
  const nameById = new Map((emps.data ?? []).map((m) => [m.id, m.name]));
  const activos = new Set((emps.data ?? []).filter((m) => m.active).map((m) => m.id));
  // Empleado ACTIVO por id de grupo de ClickUp: es el vínculo explícito que
  // decide si un evento de persona de ClickUp (cumpleaños…) se muestra.
  const empPorGrupo = new Map(
    (emps.data ?? [])
      .filter((m) => m.active && m.clickup_group_id)
      .map((m) => [String(m.clickup_group_id), m])
  );

  const events = [];

  // Días de festivo, para que tampoco rompan un tramo de ausencia.
  const festivos = new Set();
  for (const e of agenda ?? []) {
    if (e.type !== "festivo") continue;
    for (const d of eachDayISO(e.start, e.end ?? e.start)) festivos.add(d);
  }

  // Los empleados desactivados (bajas/despidos) no pintan ausencias.
  const vacActivas = (vac.data ?? []).filter((v) => activos.has(v.employee_id));
  for (const v of mergeAbsences(vacActivas, festivos)) events.push(absenceToEvent(v, nameById));

  // Agenda de empresa (festivos, cumpleaños, hitos) + hitos a nivel de tarea +
  // inicio/fin de los sprints. El cumpleaños solo se pinta si su grupo de
  // ClickUp está VINCULADO a un empleado activo; usamos su nombre de la ficha.
  for (const e of agenda ?? []) {
    if (e.type === "cumple") {
      const emp = e.whoGroupId ? empPorGrupo.get(String(e.whoGroupId)) : null;
      if (!emp) continue;                       // sin vínculo activo → no aparece
      events.push({ ...e, who: emp.name });
    } else {
      events.push(e);
    }
  }
  for (const m of milestones ?? []) events.push(m);
  for (const s of sprints ?? []) events.push(s);

  return events;
}
