import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPreviewRole, applyPreview } from "@/lib/preview";

// ¿Hay un Supabase real configurado? En modo preview o con el placeholder
// seguimos sirviendo el mock para no romper el desarrollo local.
export function isConfigured() {
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return Boolean(url) && !url.includes("placeholder");
}

// Empleado REAL del usuario logueado (match por email), sin tocar. Devuelve
// null si no hay sesión o no está dado de alta. Úsalo solo donde haga falta la
// identidad de verdad (salir de "ver como", comprobar quién puede activarlo).
export async function getRealEmployee() {
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

// Empleado con el que se pinta el portal. Si un admin está mirándolo "como"
// otro tipo de usuario, devuelve su ficha con esos permisos (ver src/lib/preview.js).
export async function getCurrentEmployee() {
  const me = await getRealEmployee();
  if (!me?.is_admin) return me; // solo un admin puede estar previsualizando
  const role = await getPreviewRole();
  return role ? applyPreview(me, role) : me;
}
