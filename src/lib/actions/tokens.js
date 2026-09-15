"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRealEmployee } from "@/lib/data/helpers";
import { nuevoToken } from "@/lib/data/tokens";

// Tokens de F*ctito. Cada uno gestiona los suyos: se crean y se revocan desde
// Mi espacio, y el secreto se enseña UNA vez —después solo queda su pista—.

export async function crearTokenFctito(nombre = "ChatGPT") {
  const me = await getRealEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, error: "Falta configuración de Supabase." };

  const { claro, hash, pista } = nuevoToken();
  const { error } = await supabase.from("api_tokens").insert({
    employee_id: me.id,
    nombre: String(nombre || "ChatGPT").slice(0, 40),
    token_hash: hash,
    pista,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mi-espacio");
  // La única vez que existe en claro.
  return { ok: true, token: claro };
}

export async function revocarTokenFctito(id) {
  const me = await getRealEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, error: "Falta configuración de Supabase." };
  const { error } = await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("employee_id", me.id); // nadie revoca los de otro
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mi-espacio");
  return { ok: true };
}
