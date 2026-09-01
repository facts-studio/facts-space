import Link from "next/link";
import { notFound } from "next/navigation";
import SprintGantt from "@/components/SprintGantt";
import { getClickUpTasks, getVisibleLists } from "@/lib/data/clickup";

// Cronograma de una lista (sprint o proyecto temporal), en su propia página:
// una vista así necesita el ancho entero y su propio scroll, no un modal.
export default async function CronogramaPage({ params }) {
  const { id } = await params;
  const [lists, tasks] = await Promise.all([getVisibleLists(), getClickUpTasks()]);
  // getVisibleLists ya filtra por permisos: si no está, o no existe o no es
  // para esta persona. En ambos casos, 404.
  const list = lists.find((l) => String(l.list_id) === String(id));
  if (!list) notFound();

  const sprint = {
    id: list.list_id,
    name: list.list_name,
    client: list.folder_name ?? null,
    start: list.list_start ? new Date(list.list_start).getTime() : null,
    due: list.list_due ? new Date(list.list_due).getTime() : null,
    note: (list.list_content || "").trim() || null,
  };

  return (
    <SprintGantt
      sprint={sprint}
      tasks={tasks.filter((t) => String(t.listId) === String(list.list_id))}
      back={<Link href="/" className="text-small text-muted hover:text-ink transition">← Inicio</Link>}
    />
  );
}
