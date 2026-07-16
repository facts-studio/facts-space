import TareasClient from "./tareas-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getClickUpTasks, getConfiguredLists, getSprintEvents } from "@/lib/data/clickup";

export default async function TareasPage() {
  const [me, tasks, lists, milestones] = await Promise.all([
    getCurrentEmployee(),
    getClickUpTasks(),
    getConfiguredLists(),
    getSprintEvents(), // inicio/fin de los sprints → se pintan en la vista Calendario
  ]);
  const visibleCount = lists.filter((l) => l.visible).length;
  const campaigns = [...new Set(lists.filter((l) => l.is_campaign && l.folder_name).map((l) => l.folder_name))];
  const statusesByList = Object.fromEntries(lists.filter((l) => (l.statuses || []).length).map((l) => [l.list_id, l.statuses]));
  const iconsByClient = Object.fromEntries(lists.filter((l) => l.icon && l.folder_name).map((l) => [l.folder_name, l.icon]));
  const colorsByClient = Object.fromEntries(lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color]));
  // Definición de cada sprint (campo "content" de la lista), por NOMBRE de lista
  // — que es como se agrupan los sprints en la vista de lista.
  const sprintNotes = Object.fromEntries(
    lists.filter((l) => l.is_sprint && (l.list_content || "").trim()).map((l) => [l.list_name, l.list_content.trim()])
  );

  return <TareasClient tasks={tasks} milestones={milestones} myEmail={me?.email ?? null} isAdmin={Boolean(me?.is_admin)} visibleCount={visibleCount} campaigns={campaigns} statusesByList={statusesByList} iconsByClient={iconsByClient} colorsByClient={colorsByClient} sprintNotes={sprintNotes} />;
}
