import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { madridDateISO, madridTime, monthEndISO } from "@/lib/dates";

// Exporta el registro de jornada de un mes en CSV (separador ';' y decimales con
// coma para Excel en español; BOM para acentos). Solo el propio empleado o, si
// es admin, cualquiera vía ?employee=. La RLS refuerza el acceso.
export async function GET(request) {
  const me = await getCurrentEmployee();
  if (!me) return new NextResponse("No autorizado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = (searchParams.get("month") || madridDateISO().slice(0, 7)).slice(0, 7);
  const employeeId = (me.is_admin && searchParams.get("employee")) || me.id;
  const from = `${month}-01`;
  const to = monthEndISO(month);

  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("clock_in, clock_out, work_date, employees:employee_id(name)")
    .eq("employee_id", employeeId)
    .eq("voided", false)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("clock_in");

  const rows = [["Empleado", "Fecha", "Entrada", "Salida", "Horas"]];
  let totalMs = 0;
  for (const e of data ?? []) {
    const ms = e.clock_out ? new Date(e.clock_out) - new Date(e.clock_in) : 0;
    totalMs += ms;
    rows.push([
      e.employees?.name ?? "",
      e.work_date,
      madridTime(e.clock_in),
      e.clock_out ? madridTime(e.clock_out) : "",
      (ms / 3600000).toFixed(2).replace(".", ","),
    ]);
  }
  rows.push([]);
  rows.push(["", "", "", "Total", (totalMs / 3600000).toFixed(2).replace(".", ",")]);

  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fichaje-${month}.csv"`,
    },
  });
}
