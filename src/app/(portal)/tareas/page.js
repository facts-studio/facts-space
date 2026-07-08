import TareasClient from "./tareas-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getClickUpTasks, getConfiguredLists } from "@/lib/data/clickup";

export default async function TareasPage() {
  const [me, tasks, lists] = await Promise.all([
    getCurrentEmployee(),
    getClickUpTasks(),
    getConfiguredLists(),
  ]);
  const visibleCount = lists.filter((l) => l.visible).length;
  const campaigns = [...new Set(lists.filter((l) => l.is_campaign && l.folder_name).map((l) => l.folder_name))];
  const statusesByList = Object.fromEntries(lists.filter((l) => (l.statuses || []).length).map((l) => [l.list_id, l.statuses]));
  const iconsByClient = Object.fromEntries(lists.filter((l) => l.icon && l.folder_name).map((l) => [l.folder_name, l.icon]));
  const colorsByClient = Object.fromEntries(lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color]));

  return <TareasClient tasks={tasks} myEmail={me?.email ?? null} visibleCount={visibleCount} campaigns={campaigns} statusesByList={statusesByList} iconsByClient={iconsByClient} colorsByClient={colorsByClient} />;
}
