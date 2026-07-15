import CalendarMonth from "@/components/CalendarMonth";
import { getCalendarEvents } from "@/lib/data/calendar";
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
  const [events, me, tasks, lists] = await Promise.all([
    getCalendarEvents(),
    getCurrentEmployee(),
    getClickUpTasks(),
    getConfiguredLists(),
  ]);
  const colorsByClient = Object.fromEntries(lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color]));
  const taskEvents = tasks.filter((t) => t.dueDate).map((t) => toEvent(t, colorsByClient));
  return <CalendarMonth events={events} tasks={taskEvents} canRequest={Boolean(me)} />;
}
