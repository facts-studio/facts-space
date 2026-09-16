"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRealEmployee } from "@/lib/data/helpers";
import { nuevoToken } from "@/lib/data/tokens";

// Llaves de F*ctito. La cuenta de ChatGPT del estudio es compartida, así que
// la llave es del estudio y la gestiona administración desde el panel. El
// secreto se enseña UNA vez; después solo queda su pista.

export async function crearTokenFctito(nombre = "ChatGPT del equipo") {
  const me = await getRealEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, error: "Falta configuración de Supabase." };

  const { claro, hash, pista } = nuevoToken();
  const { error } = await supabase.from("api_tokens").insert({
    // Queda quién la creó, para saber a quién preguntar; el alcance NO es el
    // suyo: F*ctito contesta siempre como un miembro del equipo cualquiera.
    employee_id: me.id,
    nombre: String(nombre || "ChatGPT").slice(0, 40),
    token_hash: hash,
    pista,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  // La única vez que existe en claro.
  return { ok: true, token: claro };
}

export async function revocarTokenFctito(id) {
  const me = await getRealEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, error: "Falta configuración de Supabase." };
  const { error } = await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
