"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { madridDateISO } from "@/lib/dates";

// Fichar entrada. No se permite si ya hay una jornada abierta.
export async function clockIn() {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("employee_id", me.id)
    .is("clock_out", null)
    .eq("voided", false)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (open) return { ok: false, error: "Ya tienes una jornada abierta." };

  const now = new Date();
  const { error } = await supabase.from("time_entries").insert({
    employee_id: me.id,
    clock_in: now.toISOString(),
    work_date: madridDateISO(now),
    source: "web",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fichaje");
  return { ok: true };
}

// Fichar salida de la jornada abierta.
export async function clockOut() {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("time_entries")
    .select("id, clock_in")
    .eq("employee_id", me.id)
    .is("clock_out", null)
    .eq("voided", false)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!open) return { ok: false, error: "No tienes ninguna jornada abierta." };

  const { error } = await supabase
    .from("time_entries")
    .update({ clock_out: new Date().toISOString() })
    .eq("id", open.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fichaje");
  return { ok: true };
}
