import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Cron diario (ver vercel.json): marca como "complete" en ClickUp las vacaciones
// cuya fecha de fin ya ha pasado. Idempotente. La lista Vacaciones de la Agenda.
const BASE = "https://api.clickup.com/api/v2";
const VAC_LIST = "901520598266";
const madridISO = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(ms));

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const tok = process.env.CLICKUP_API_TOKEN;
  if (!tok) return NextResponse.json({ ok: false, error: "clickup no configurado" });

  const today = madridISO(Date.now());
  const res = await fetch(`${BASE}/list/${VAC_LIST}/task?include_closed=true`, {
    headers: { Authorization: tok },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: `clickup ${res.status}` });
  const { tasks = [] } = await res.json();

  let completed = 0;
  for (const t of tasks) {
    if (t.due_date && madridISO(Number(t.due_date)) < today && t.status?.status !== "complete") {
      await fetch(`${BASE}/task/${t.id}`, {
        method: "PUT",
        headers: { Authorization: tok, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "complete" }),
      });
      completed++;
    }
  }
  return NextResponse.json({ ok: true, today, completed });
}
