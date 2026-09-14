"use server";

import { headers } from "next/headers";
import { getRealEmployee } from "@/lib/data/helpers";
import { signShare } from "@/lib/share";

// Dominio público del portal. Un enlace para alguien de fuera NO puede salir
// apuntando a localhost, así que se busca por orden de fiabilidad:
//   1. SHARE_BASE_URL — si algún día el portal vive en un dominio propio.
//   2. El dominio de producción que Vercel inyecta (aunque se genere en una
//      preview: se comparte lo estable, no una rama).
//   3. La cabecera del navegador desde el que se pulsa.
//   4. NEXT_PUBLIC_SITE_URL, que en desarrollo es localhost — último recurso.
async function baseUrl() {
  const explicito = process.env.SHARE_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (explicito) return explicito.startsWith("http") ? explicito : `https://${explicito}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    return `${h.get("x-forwarded-proto") || "https"}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "";
}

// Crea el enlace público del calendario de proyectos de Adhōc. Solo
// administración: enseña nombres de proyectos de clientes a quien lo tenga.
export async function crearEnlaceTimeline(dias = 30) {
  const me = await getRealEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  const token = signShare("timeline-adhoc", dias);
  if (!token) return { ok: false, error: "Falta SHARE_SECRET en el entorno." };

  const base = await baseUrl();
  const url = `${base}/publico/timeline/${token}`;
  // Avisa en vez de repartir un enlace muerto: en desarrollo no hay dominio
  // público y el enlace solo abre en esta máquina.
  const local = /localhost|127\.0\.0\.1/.test(base) || !base;
  return { ok: true, url, dias, local };
}
