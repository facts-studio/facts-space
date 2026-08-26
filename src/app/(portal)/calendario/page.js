import CalendarMonth from "@/components/CalendarMonth";
import { getCalendarEvents, getPendingAbsenceEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getClickUpTasks, getConfiguredLists } from "@/lib/data/clickup";
import { getEmployees } from "@/lib/data/employees";
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
    // Todos los asignados nominales (para detectar conflictos con ausencias).
    // Las tareas de "Team" (everyone) se excluyen: son de toda la plantilla y
    // marcarían conflicto en cuanto alguien se fuese de vacaciones.
    whoAll: t.everyone ? [] : (t.assignees || []).map((a) => a.name).filter(Boolean),
    client: t.project || null,
    list: t.listName || null,
    url: t.url || null,
    tint: paletteColor(t.project || "Sin cliente", colorsByClient[t.project]),
  };
}

export default async function CalendarioPage() {
  const [events, pending, me, tasks, lists, team] = await Promise.all([
    getCalendarEvents(),
    getPendingAbsenceEvents(), // solicitadas sin aprobar → pastilla discontinua
    getCurrentEmployee(),
    getClickUpTasks(),
    getConfiguredLists(),
    getEmployees(), // plantilla activa real (no el mock) para la fila de personas
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
      team={(team || []).map((e) => ({ id: e.id, name: e.name, photo: e.photo }))}
      canRequest={Boolean(me)}
    />
  );
}
