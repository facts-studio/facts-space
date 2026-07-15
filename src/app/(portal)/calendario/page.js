import CalendarMonth from "@/components/CalendarMonth";
import { getCalendarEvents, getPendingAbsenceEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getClickUpTasks, getConfiguredLists } from "@/lib/data/clickup";
import { paletteColor } from "@/lib/client-palette";

// Tarea de ClickUp → evento del calendario (tipo "tarea", en su fecha límite).
// `tint` lleva el color del CLIENTE al que pertenece (mismo criterio que el
// avatar de cliente: el elegido en admin o, si no, determinista por el nombre).
function toEvent(t, colorsByClient) {
  const iso = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const end = iso(t.dueDate);
  const start = t.startDate && t.startDate < t.dueDate ? iso(t.startDate) : end;
  return {
    id: `task-${t.id}`,
    type: "tarea",
    title: t.name,
    start,
    end,
    who: t.assignees?.[0]?.name || null,
    client: t.project || null,
    tint: paletteColor(t.project || "Sin cliente", colorsByClient[t.project]),
  };
}

export default async function CalendarioPage() {
  const [events, pending, me, tasks, lists] = await Promise.all([
    getCalendarEvents(),
    getPendingAbsenceEvents(), // solicitadas sin aprobar → pastilla discontinua
    getCurrentEmployee(),
    getClickUpTasks(),
    getConfiguredLists(),
  ]);
  const colorsByClient = Object.fromEntries(lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color]));
  const taskEvents = tasks.filter((t) => t.dueDate).map((t) => toEvent(t, colorsByClient));
  // Los hitos que pertenecen a un cliente (sprints y milestones de tarea) llevan
  // su tinte: el calendario lo usa cuando la vista de tareas está activa.
  const withTint = (e) =>
    e.type === "hito" && e.client ? { ...e, tint: paletteColor(e.client, colorsByClient[e.client]) } : e;
  return (
    <CalendarMonth
      events={events.concat(pending).map(withTint)}
      tasks={taskEvents}
      canRequest={Boolean(me)}
    />
  );
}
