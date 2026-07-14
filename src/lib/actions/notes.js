"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";

// Cliente + empleado dueño. Todas las mutaciones se acotan a employee_id (además
// de la RLS) para que nadie toque notas ajenas.
async function owner() {
  const me = await getCurrentEmployee();
  if (!me) return { me: null, supabase: null };
  return { me, supabase: await createClient() };
}

// Crea una nota vacía (texto o checklist) y la devuelve.
export async function createNote(kind = "text") {
  const { me, supabase } = await owner();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const k = kind === "checklist" ? "checklist" : "text";
  const { data, error } = await supabase
    .from("notes")
    .insert({ employee_id: me.id, kind: k })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true, note: data };
}

// Actualiza campos permitidos de una nota. No revalida (el cliente mantiene su
// estado local; el autoguardado no debe repintar el servidor en cada tecla).
export async function updateNote(id, patch = {}) {
  const { me, supabase } = await owner();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const allowed = {};
  for (const k of ["title", "body", "items", "pinned", "kind"]) {
    if (k in patch) allowed[k] = patch[k];
  }
  if (Object.keys(allowed).length === 0) return { ok: true };
  allowed.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("notes")
    .update(allowed)
    .eq("id", id)
    .eq("employee_id", me.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Borra una nota.
export async function deleteNote(id) {
  const { me, supabase } = await owner();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const { error } = await supabase.from("notes").delete().eq("id", id).eq("employee_id", me.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}
