import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, getCurrentEmployee } from "./helpers";

// Documentos del empleado logueado, opcionalmente por categoría.
export async function getMyDocuments(category) {
  const me = await getCurrentEmployee();
  if (!me) return [];
  const supabase = await createClient();
  let q = supabase
    .from("documents")
    .select("id, category, title, period, created_at")
    .eq("employee_id", me.id)
    .order("created_at", { ascending: false });
  if (category) q = q.eq("category", category);
  const { data } = await q;
  return data ?? [];
}

// Todos los documentos (admin), con nombre del empleado.
export async function getAllDocuments() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, employee_id, category, title, period, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}
