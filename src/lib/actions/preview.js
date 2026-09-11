"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getRealEmployee } from "@/lib/data/helpers";
import { PREVIEW_COOKIE, PREVIEW_ROLES } from "@/lib/preview";

// Entra o sale de "ver el portal como…". Se comprueba contra el empleado REAL:
// mientras previsualizas tu ficha dice que no eres admin, así que preguntarle a
// getCurrentEmployee te dejaría encerrado sin poder volver.
export async function setPreviewRole(role) {
  const me = await getRealEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };

  const jar = await cookies();
  if (!role) jar.delete(PREVIEW_COOKIE);
  else if (PREVIEW_ROLES[role]) {
    jar.set(PREVIEW_COOKIE, role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 4, // se cae solo en 4 h: nadie quiere olvidarse dentro
    });
  } else return { ok: false, error: "Rol no válido." };

  revalidatePath("/", "layout");
  return { ok: true };
}
