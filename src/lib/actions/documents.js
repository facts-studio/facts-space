"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";

// Registra en BD un documento ya subido a Storage (la subida del archivo la hace
// el cliente con el navegador; aquí solo guardamos la fila). Solo admin.
export async function recordDocument({ employeeId, category, title = "", period = "", storagePath }) {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  if (!employeeId || !category || !storagePath) return { ok: false, error: "Faltan datos." };
  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    employee_id: employeeId,
    category,
    title: title.trim(),
    period: period.trim(),
    storage_path: storagePath,
    uploaded_by: me.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/mi-espacio");
  return { ok: true };
}

// Borra un documento (fila + archivo). Solo admin.
export async function deleteDocument(id) {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (doc?.storage_path) await supabase.storage.from("hr-docs").remove([doc.storage_path]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/mi-espacio");
  return { ok: true };
}

// Devuelve una URL firmada (caducable) para descargar. Dueño o admin (RLS).
export async function getDocumentUrl(id) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No autenticado." };
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (!doc) return { ok: false, error: "Documento no encontrado." };
  const { data, error } = await supabase.storage.from("hr-docs").createSignedUrl(doc.storage_path, 120);
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: data.signedUrl };
}
