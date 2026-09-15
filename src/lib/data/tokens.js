import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Tokens personales para hablar con el portal desde fuera (ChatGPT, Claude…).
//
// El token identifica A LA PERSONA: quien lo use ve lo que vería entrando con
// su cuenta y escribe con sus permisos. Por eso no hay ninguno "de servicio".
//
// Solo se guarda el hash. En claro se enseña una vez al crearlo.
const PREFIJO = "fsp_";

export const hashToken = (t) => createHash("sha256").update(String(t)).digest("hex");

export function nuevoToken() {
  const claro = PREFIJO + randomBytes(24).toString("base64url");
  return { claro, hash: hashToken(claro), pista: `${claro.slice(0, 10)}…` };
}

// Persona detrás de un token, o null. Se compara en tiempo constante para no
// filtrar información por lo que tarda en fallar.
export async function empleadoDeToken(token) {
  if (!token || !String(token).startsWith(PREFIJO)) return null;
  const supabase = createAdminClient();
  if (!supabase) return null;

  const hash = hashToken(token);
  const { data } = await supabase
    .from("api_tokens")
    .select("id, employee_id, token_hash, revoked_at, employees(*)")
    .eq("token_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();
  if (!data?.employees) return null;

  const a = Buffer.from(data.token_hash);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Sin await: saber cuándo se usó por última vez no vale una espera en cada
  // llamada, y si falla tampoco pasa nada.
  supabase.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(
    () => {},
    () => {}
  );
  return data.employees;
}
