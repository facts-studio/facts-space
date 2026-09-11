import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import SprintBoard from "@/components/tasks/SprintBoard";
import SinAcceso from "@/components/SinAcceso";
import { getVisibleLists, getClickUpTasks, flattenTasks, isMine } from "@/lib/data/clickup";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { isColaborador } from "@/lib/team";

// Un sprint suelto, con sus tareas en columnas por estado. Es la única vista de
// trabajo de un colaborador: entra por los proyectos que se le adjudican, así
// que no ve el tablero del estudio pero sí el sprint donde tiene tareas.
export default async function SprintPage({ params }) {
  const { id } = await params;
  const [lists, tasks, me] = await Promise.all([getVisibleLists(), getClickUpTasks(), getCurrentEmployee()]);
  // getVisibleLists ya filtra por permisos: si no está, o no existe o no es
  // para esta persona. En ambos casos, 404.
  const list = lists.find((l) => String(l.list_id) === String(id));
  if (!list) notFound();

  const items = tasks.filter((t) => String(t.listId) === String(list.list_id));

  // Para un colaborador, "asignado" es tener trabajo dentro: si no hay nada
  // suyo en este sprint, no es su proyecto.
  if (isColaborador(me)) {
    const mio = flattenTasks(items).some((t) => isMine(t, me.email));
    if (!mio) {
      return (
        <SinAcceso kicker="Proyecto" title={list.list_name}>
          No tienes tareas en este proyecto, así que no es uno de los tuyos. Si debería serlo, pídele
          al estudio que te asigne el trabajo.
        </SinAcceso>
      );
    }
  }

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
