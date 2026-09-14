import "server-only";
import { getClickUpGroups } from "./clickup";

// Completa cada empleado con lo que vive en su perfil de ClickUp (vínculo por
// clickup_group_id):
//   · photo → solo si no tiene una propia; la subida en su ficha siempre manda.
//   · clickup_group_name → el nombre con el que se le conoce en ClickUp, que es
//     la identidad con la que se le adjudica un proyecto (ver src/lib/projects.js).
export async function withClickUpAvatars(employees) {
  if (!employees?.length) return employees ?? [];
  if (!employees.some((e) => e.clickup_group_id)) return employees;
  const groups = await getClickUpGroups();
  const byId = new Map(groups.map((g) => [String(g.id), g]));
  return employees.map((e) => {
    const g = e.clickup_group_id ? byId.get(String(e.clickup_group_id)) : null;
    if (!g) return e;
    return {
      ...e,
      photo: e.photo || g.avatar || e.photo,
      clickup_group_name: g.name ?? null,
    };
  });
}
