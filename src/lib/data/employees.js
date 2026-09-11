import "server-only";
import { createClient } from "@/lib/supabase/server";
import { TEAM as MOCK_TEAM } from "@/lib/mock";
import { isConfigured } from "./helpers";
import { withClickUpAvatars } from "./avatars";

// Directorio del equipo, en el shape que usan equipo/admin (mismas claves que
// el array TEAM del mock). Fallback al mock si no hay Supabase.
const CAMPOS = "id, name, last_name, role, email, birthday, color, photo, manager_id, is_admin, is_external, company, vacation_allowance, vacation_adjustment, active, clickup_group_id";

export async function getEmployees() {
  if (!isConfigured()) return MOCK_TEAM;
  const supabase = await createClient();
  // access_role es nuevo (migración 0035). Mientras no esté aplicada la columna
  // no existe y PostgREST rechaza la consulta entera, así que se reintenta sin
  // ella: roleOf() sabe deducir el rol de is_external. En cuanto la migración
  // corra, esto pasa a leer la columna sin tocar nada.
  let { data } = await supabase.from("employees").select(`${CAMPOS}, access_role`).eq("active", true).order("name");
  if (!data) ({ data } = await supabase.from("employees").select(CAMPOS).eq("active", true).order("name"));
  return withClickUpAvatars(data ?? []);
}
