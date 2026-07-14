"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";

const YEAR = 60 * 60 * 24 * 365;
const cookieOpts = { path: "/", maxAge: YEAR, sameSite: "lax" };

// Persiste una preferencia de UI en el empleado + cookie espejo (para que el
// SSR la aplique sin parpadeo la próxima vez). Best-effort: si no hay sesión o
// la columna aún no existe (migración sin ejecutar), no rompe la UI.
async function savePref(column, dbValue, cookieName, cookieValue) {
  try {
    (await cookies()).set(cookieName, cookieValue, cookieOpts);
  } catch {}
  try {
    const me = await getCurrentEmployee();
    if (!me) return { ok: true }; // preview / sin sesión: solo cookie
    const supabase = await createClient();
    await supabase.from("employees").update({ [column]: dbValue }).eq("id", me.id);
  } catch {}
  return { ok: true };
}

// Tema: 'light' | 'dark'.
export async function setTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  return savePref("theme", t, "theme", t);
}

// Menú lateral recogido.
export async function setNavCollapsed(collapsed) {
  const c = Boolean(collapsed);
  return savePref("nav_collapsed", c, "nav-collapsed", c ? "1" : "0");
}
