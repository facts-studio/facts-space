import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFactsProject } from "@/lib/projects";

// Datos de una vista pública. Van con service-role porque quien mira no tiene
// sesión, así que el recorte lo hace ESTA función y no la RLS: solo proyectos
// de Adhōc, y solo los campos que se enseñan. Nada de tareas, personas ni
// clientes de Unfiltrade.
export async function getTimelinePublico() {
  const supabase = createAdminClient();
  if (!supabase) return [];
  const CAMPOS = "list_id, list_name, folder_name, space_id, space_name, list_content, list_start, list_due";
  // list_priority llega con la migración 0036; hasta entonces se lee sin ella
  // (isFactsProject sabe caer a la cabecera de la descripción).
  let { data } = await supabase.from("clickup_lists").select(`${CAMPOS}, list_priority`).order("list_start");
  if (!data) ({ data } = await supabase.from("clickup_lists").select(CAMPOS).order("list_start"));
  return (data ?? []).filter(isFactsProject);
}
