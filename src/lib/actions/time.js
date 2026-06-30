"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { madridToUTC, madridDateISO, iso as toISODate } from "@/lib/dates";

const validTime = (s) => /^\d{2}:\d{2}$/.test(s || "");

// Recorre los días [fromISO, toISO] (ambos incluidos) llamando cb(diaISO).
function eachDay(fromISO, toISO, cb) {
  const end = new Date(toISO + "T00:00:00");
  let guard = 0;
  for (const d = new Date(fromISO + "T00:00:00"); d <= end && guard < 1000; d.setDate(d.getDate() + 1), guard++) {
    cb(toISODate(d), d.getDay());
  }
}

// Añadir un fichaje manual (una franja entrada/salida en un día).
export async function addEntry({ date, start, end }) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  if (!date || !validTime(start) || !validTime(end)) return { ok: false, error: "Completa fecha, entrada y salida." };
  if (end <= start) return { ok: false, error: "La salida debe ser posterior a la entrada." };

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    employee_id: me.id,
    clock_in: madridToUTC(date, start).toISOString(),
    clock_out: madridToUTC(date, end).toISOString(),
    work_date: date,
    source: "manual",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fichaje");
  return { ok: true };
}

// Anular un fichaje propio (append-only: no se borra, se marca voided).
export async function voidEntry(id) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({ voided: true })
    .eq("id", id)
    .eq("employee_id", me.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fichaje");
  return { ok: true };
}

// Autorrellenar: crea un fichaje con el horario indicado en todos los días
// laborables de [fromDate, toDate] en los que NO haya fichaje, saltando findes,
// festivos, el cumpleaños de la persona y sus vacaciones aprobadas.
export async function autofillTime({ fromDate, toDate, start, end }) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No has iniciado sesión." };
  if (!fromDate || !validTime(start) || !validTime(end) || end <= start) return { ok: false, error: "Revisa el rango y el horario." };
  const to = toDate || madridDateISO();
  if (to < fromDate) return { ok: false, error: "El rango es inválido." };

  const supabase = await createClient();
  const [{ data: fes }, { data: vac }, { data: existing }] = await Promise.all([
    supabase.from("calendar_events").select("start_date, end_date").eq("type", "festivo"),
    supabase.from("vacation_requests").select("start_date, end_date").eq("employee_id", me.id).eq("status", "approved"),
    supabase.from("time_entries").select("work_date").eq("employee_id", me.id).eq("voided", false).gte("work_date", fromDate).lte("work_date", to),
  ]);

  const festivoSet = new Set();
  for (const f of fes ?? []) eachDay(f.start_date, f.end_date, (d) => festivoSet.add(d));
  const vacSet = new Set();
  for (const v of vac ?? []) eachDay(v.start_date, v.end_date, (d) => vacSet.add(d));
  const haveSet = new Set((existing ?? []).map((e) => e.work_date));
  const bday = me.birthday ? me.birthday.slice(5) : null;

  const rows = [];
  const skipped = { weekend: 0, festivo: 0, cumple: 0, vacaciones: 0, yaFichado: 0 };
  eachDay(fromDate, to, (d, dow) => {
    if (dow === 0 || dow === 6) return skipped.weekend++;
    if (festivoSet.has(d)) return skipped.festivo++;
    if (bday && d.slice(5) === bday) return skipped.cumple++;
    if (vacSet.has(d)) return skipped.vacaciones++;
    if (haveSet.has(d)) return skipped.yaFichado++;
    rows.push({
      employee_id: me.id,
      clock_in: madridToUTC(d, start).toISOString(),
      clock_out: madridToUTC(d, end).toISOString(),
      work_date: d,
      source: "auto",
    });
  });

  if (rows.length) {
    const { error } = await supabase.from("time_entries").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/fichaje");
  return { ok: true, count: rows.length, skipped };
}
