import "server-only";
import { cookies } from "next/headers";

// ── Ver el portal como otro tipo de usuario ──────────────────────────────────
// Un admin puede mirar el portal con los permisos de un compañero de plantilla
// o de un colaborador externo, para comprobar qué ve cada uno sin tener que
// pedirle la pantalla ni crear cuentas de prueba.
//
// Lo que cambia son los PERMISOS y la navegación, no los datos: las consultas
// siguen saliendo con la sesión real (la RLS de Supabase manda), así que lo que
// se ve son las propias ausencias y fichajes, con el acceso del rol elegido.
export const PREVIEW_COOKIE = "fcts-ver-como";
export const PREVIEW_ROLES = {
  interno: { label: "compañero de plantilla", isExternal: false },
  externo: { label: "colaborador externo", isExternal: true },
};

export async function getPreviewRole() {
  const jar = await cookies();
  const v = jar.get(PREVIEW_COOKIE)?.value;
  return v && PREVIEW_ROLES[v] ? v : null;
}

// Aplica el rol elegido sobre el empleado real. Siempre quita el admin: un
// compañero no lo es, y si no se quitara el previsualizador seguiría viendo
// Administrar, que es justo lo que se quiere comprobar.
export function applyPreview(employee, role) {
  if (!employee || !role || !PREVIEW_ROLES[role]) return employee;
  return {
    ...employee,
    is_admin: false,
    is_external: PREVIEW_ROLES[role].isExternal,
    _previewRole: role,
  };
}
