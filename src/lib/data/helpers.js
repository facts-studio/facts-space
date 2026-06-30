import "server-only";
import { createClient } from "@/lib/supabase/server";

// ¿Hay un Supabase real configurado? En modo preview o con el placeholder
// seguimos sirviendo el mock para no romper el desarrollo local.
export function isConfigured() {
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return Boolean(url) && !url.includes("placeholder");
}

// Empleado correspondiente al usuario logueado (match por email). Devuelve null
// si no hay sesión o no está dado de alta.
export async function getCurrentEmployee() {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();
  return data ?? null;
}
