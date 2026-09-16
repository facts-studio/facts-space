import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { createClient } from "@/lib/supabase/server";
import { getPreviewRole, applyPreview } from "@/lib/preview";

// Identidad impuesta para una petición que NO viene del navegador: el MCP, que
// se autentica con un token personal y no con la cookie de sesión. Va por
// AsyncLocalStorage para que valga en toda la cadena de llamadas sin tener que
// pasar el empleado por parámetro a media aplicación.
const identidad = new AsyncLocalStorage();
export function comoEmpleado(empleado, fn) {
  return identidad.run(empleado, fn);
}

// ¿Estamos sirviendo una petición con token (MCP) en vez de una del navegador?
// Lo consultan las lecturas de configuración: sin cookie de sesión, la RLS las
// deja vacías y hay que leerlas con service-role. El recorte por persona se
// sigue aplicando después, en código.
export const conIdentidadImpuesta = () => Boolean(identidad.getStore());

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
  const impuesta = identidad.getStore();
  if (impuesta) return impuesta;
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
  const impuesta = identidad.getStore();
  if (impuesta) return impuesta; // petición con token: esa es la persona
  const me = await getRealEmployee();
  if (!me?.is_admin) return me; // solo un admin puede estar previsualizando
  const role = await getPreviewRole();
  return role ? applyPreview(me, role) : me;
}
