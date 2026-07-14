import "server-only";
import { createClient } from "@/lib/supabase/server";
import { TEAM as MOCK_TEAM } from "@/lib/mock";
import { isConfigured } from "./helpers";

// Directorio del equipo, en el shape que usan equipo/admin (mismas claves que
// el array TEAM del mock). Fallback al mock si no hay Supabase.
export async function getEmployees() {
  if (!isConfigured()) return MOCK_TEAM;
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, last_name, role, email, birthday, color, photo, manager_id, is_admin, vacation_allowance, vacation_adjustment, active")
    .eq("active", true)
    .order("name");
  return data ?? [];
}
