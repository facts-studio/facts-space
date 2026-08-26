import "server-only";
import { getClickUpAvatarsByGroup } from "./clickup";

// Completa la foto de quien no tiene una propia con la de su perfil de ClickUp
// (vínculo por clickup_group_id). La foto subida en la ficha siempre manda.
export async function withClickUpAvatars(employees) {
  if (!employees?.length) return employees ?? [];
  if (!employees.some((e) => !e.photo && e.clickup_group_id)) return employees;
  const byGroup = await getClickUpAvatarsByGroup();
  return employees.map((e) =>
    e.photo || !e.clickup_group_id ? e : { ...e, photo: byGroup[e.clickup_group_id] ?? e.photo }
  );
}
