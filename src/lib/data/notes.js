import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, getCurrentEmployee } from "./helpers";

// Notas personales del usuario logueado (bloc privado). Sin Supabase → vacío.
export async function getMyNotes() {
  if (!isConfigured()) return [];
  const me = await getCurrentEmployee();
  if (!me) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("employee_id", me.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}
