import CalendarMonth from "@/components/CalendarMonth";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getClickUpTasks } from "@/lib/data/clickup";

// Tarea de ClickUp → evento del calendario (tipo "tarea", en su fecha límite).
function toEvent(t) {
  const iso = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const end = iso(t.dueDate);
  const start = t.startDate && t.startDate < t.dueDate ? iso(t.startDate) : end;
  return { id: `task-${t.id}`, type: "tarea", title: t.name, start, end, who: t.assignees?.[0]?.name || null };
}

export default async function CalendarioPage() {
  const [events, me, tasks] = await Promise.all([getCalendarEvents(), getCurrentEmployee(), getClickUpTasks()]);
  const taskEvents = tasks.filter((t) => t.dueDate).map(toEvent);
  return <CalendarMonth events={events} tasks={taskEvents} canRequest={Boolean(me)} />;
}
