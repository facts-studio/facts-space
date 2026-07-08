"use server";

import { revalidatePath } from "next/cache";
import { isClickUpConfigured, getClickUpHierarchy } from "@/lib/data/clickup";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";

const BASE = "https://api.clickup.com/api/v2";

async function requireAdmin() {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) return { ok: false, error: "Sin permisos" };
  return { ok: true };
}

// Sincroniza la jerarquía de ClickUp en clickup_lists, preservando el flag
// `visible` que el admin ya haya marcado. Las listas nuevas entran ocultas.
export async function syncClickUpLists() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!isClickUpConfigured()) return { ok: false, error: "ClickUp no configurado" };
  try {
    const rows = await getClickUpHierarchy();
    if (!rows.length) return { ok: false, error: "ClickUp no devolvió listas" };
    const supabase = await createClient();
    const { data: existing } = await supabase.from("clickup_lists").select("list_id, visible");
    const known = new Map((existing ?? []).map((r) => [r.list_id, r.visible]));
    // Conserva la visibilidad previa; las listas nuevas "Tareas" nacen activas.
    const payload = rows.map((r) => ({
      ...r,
      visible: known.has(r.list_id) ? known.get(r.list_id) : (r.list_name || "").trim().toLowerCase() === "tareas",
      synced_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("clickup_lists").upsert(payload, { onConflict: "list_id" });
    if (error) return { ok: false, error: error.message };
    // Limpia listas que ya no existen en ClickUp (evita columnas fantasma).
    const currentSet = new Set(rows.map((r) => r.list_id));
    const stale = (existing ?? []).map((r) => r.list_id).filter((id) => !currentSet.has(id));
    if (stale.length) await supabase.from("clickup_lists").delete().in("list_id", stale);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/tareas");
    return { ok: true, count: payload.length, removed: stale.length };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Guarda (o borra) el icono de una carpeta — data-URI del SVG. `icon` null = quitar.
export async function setFolderIcon(listIds, icon) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!Array.isArray(listIds) || !listIds.length) return { ok: false, error: "Sin listas" };
  if (icon && icon.length > 200000) return { ok: false, error: "El SVG es demasiado grande" };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clickup_lists").update({ icon: icon || null }).in("list_id", listIds);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Guarda (o borra) el color de una carpeta (key de la paleta). null = automático.
export async function setFolderColor(listIds, color) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!Array.isArray(listIds) || !listIds.length) return { ok: false, error: "Sin listas" };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clickup_lists").update({ color: color || null }).in("list_id", listIds);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Marca/desmarca un conjunto de listas (una carpeta) como campaña.
export async function setFolderCampaign(listIds, isCampaign) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!Array.isArray(listIds) || !listIds.length) return { ok: false, error: "Sin listas" };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clickup_lists").update({ is_campaign: isCampaign }).in("list_id", listIds);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Fija el acceso de un conjunto de listas: "off" (oculta) · "all" (todos) ·
// "admin" (solo perfiles admin). Es la fuente de verdad de visibilidad.
export async function setListsAccess(listIds, access) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!Array.isArray(listIds) || !listIds.length) return { ok: false, error: "Sin listas" };
  const visible = access !== "off";
  const admin_only = access === "admin";
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clickup_lists").update({ visible, admin_only }).in("list_id", listIds);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Cierra (completa) una tarea en ClickUp cambiando su estado al de tipo
// "closed". CLICKUP_DONE_STATUS permite fijar el nombre exacto (por defecto
// "Closed", que es el de la lista Management). Escribe en ClickUp de verdad.
export async function closeClickUpTask(taskId) {
  if (!isClickUpConfigured()) {
    // En mock no hay nada que cerrar; fingimos éxito para la UI local.
    return { ok: true, mock: true };
  }
  const status = process.env.CLICKUP_DONE_STATUS || "Closed";
  try {
    const res = await fetch(`${BASE}/task/${taskId}`, {
      method: "PUT",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `ClickUp ${res.status}: ${detail.slice(0, 140)}` };
    }
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Fuerza recarga de las tareas (invalida la caché de fetch de ClickUp).
export async function refreshClickUpTasks() {
  revalidatePath("/tareas");
  revalidatePath("/");
  return { ok: true };
}

// Estados disponibles de una lista (fallback cuando no se han sincronizado).
export async function getListStatuses(listId) {
  if (!isClickUpConfigured() || !listId) return { ok: true, statuses: [] };
  try {
    const res = await fetch(`${BASE}/list/${listId}`, {
      headers: { Authorization: process.env.CLICKUP_API_TOKEN },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { ok: false, error: `ClickUp ${res.status}` };
    const j = await res.json();
    const statuses = (j.statuses ?? []).map((s) => ({ status: s.status, type: s.type, color: s.color, orderindex: s.orderindex }));
    return { ok: true, statuses };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Detalle de una tarea (descripción incluida) para el panel lateral.
export async function getClickUpTaskDetail(taskId) {
  if (!isClickUpConfigured()) return { ok: true, description: "Descripción de ejemplo (modo mock)." };
  try {
    const res = await fetch(`${BASE}/task/${taskId}?include_markdown_description=true`, {
      headers: { Authorization: process.env.CLICKUP_API_TOKEN },
      next: { revalidate: 60 },
    });
    if (!res.ok) return { ok: false, error: `ClickUp ${res.status}` };
    const j = await res.json();
    return { ok: true, description: (j.markdown_description || j.description || j.text_content || "").trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Cambia el estado de una tarea al `status` indicado (nombre exacto de ClickUp).
export async function setClickUpTaskStatus(taskId, status) {
  if (!isClickUpConfigured()) return { ok: true, mock: true };
  if (!status) return { ok: false, error: "Sin estado" };
  try {
    const res = await fetch(`${BASE}/task/${taskId}`, {
      method: "PUT",
      headers: { Authorization: process.env.CLICKUP_API_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `ClickUp ${res.status}: ${detail.slice(0, 140)}` };
    }
    revalidatePath("/");
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
