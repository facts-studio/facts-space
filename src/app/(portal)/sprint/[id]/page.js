import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import SprintBoard from "@/components/tasks/SprintBoard";
import { getVisibleLists, getClickUpTasks } from "@/lib/data/clickup";

// Un sprint suelto, con sus tareas en columnas por estado. Es la única vista de
// trabajo de un colaborador: entra por los proyectos que se le adjudican, así
// que no ve el tablero del estudio pero sí el sprint donde tiene tareas.
export default async function SprintPage({ params }) {
  const { id } = await params;
  const [lists, tasks] = await Promise.all([getVisibleLists(), getClickUpTasks()]);
  // getVisibleLists ya filtra por permisos: si no está, o no existe o no es
  // para esta persona. En ambos casos, 404.
  const list = lists.find((l) => String(l.list_id) === String(id));
  if (!list) notFound();

  // La adjudicación se declara en ClickUp y getVisibleLists ya la aplica: si
  // este sprint no es de quien mira, no aparece arriba y esto es un 404.
  const items = tasks.filter((t) => String(t.listId) === String(list.list_id));

  const sprint = {
    id: list.list_id,
    name: list.list_name,
    client: list.folder_name ?? null,
    start: list.list_start ? new Date(list.list_start).getTime() : null,
    due: list.list_due ? new Date(list.list_due).getTime() : null,
    note: (list.list_content || "").trim() || null,
  };

  return (
    <div>
      <Link href="/" className="text-small text-muted hover:text-ink transition inline-flex items-center gap-1.5 mb-4">← Inicio</Link>
      <ScreenHeader kicker={sprint.client || "Proyecto"} title={sprint.name} />
      <SprintBoard sprint={sprint} tasks={items} statuses={list.statuses ?? []} />
    </div>
  );
}
