"use server";

import { getRealEmployee } from "@/lib/data/helpers";
import { signShare } from "@/lib/share";

// Crea el enlace público del timeline de Adhōc. Solo administración: enseña
// nombres de proyectos de clientes a quien tenga el enlace.
export async function crearEnlaceTimeline(dias = 30) {
  const me = await getRealEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  const token = signShare("timeline-adhoc", dias);
  if (!token) return { ok: false, error: "Falta SHARE_SECRET en el entorno." };
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  return { ok: true, url: `${base}/publico/timeline/${token}`, dias };
}
