import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// ── Enlaces públicos ────────────────────────────────────────────────────────
// Un enlace que se puede abrir sin cuenta, para enseñarle a alguien de fuera
// una vista concreta. No hay tabla: el propio enlace lleva firmado qué vista es
// y hasta cuándo vale, así que no se puede fabricar a mano ni adivinar.
//
// Caducan solos. Para invalidar todos los repartidos antes de tiempo, se cambia
// SHARE_SECRET en el entorno: es un martillo, pero no hace falta más para lo
// que esto es.
const secret = () => process.env.SHARE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const firma = (payload) => b64(createHmac("sha256", secret()).update(payload).digest());

export function signShare(vista, dias = 30) {
  if (!secret()) return null;
  const exp = Date.now() + dias * 86400000;
  const payload = b64(JSON.stringify({ v: vista, exp }));
  return `${payload}.${firma(payload)}`;
}

// Devuelve la vista si el token es válido y no ha caducado; null si no.
export function readShare(token) {
  if (!token || !secret()) return null;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  // timingSafeEqual exige la misma longitud; comparar antes evita que lance.
  const esperada = firma(payload);
  if (sig.length !== esperada.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(esperada))) return null;
  try {
    const { v, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!v || !exp || Date.now() > exp) return null;
    return { vista: v, exp };
  } catch {
    return null;
  }
}
