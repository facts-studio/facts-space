import { NextResponse } from "next/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { reconcileVacationFromClickUp } from "@/lib/clickup-vacations";

export const runtime = "nodejs";

// Webhook de ClickUp → sincroniza de VUELTA los cambios en tareas de vacaciones
// (estado, fechas, borrado) a la intranet. Solo afecta a vacaciones creadas
// desde el portal (que tienen clickup_task_id). Ver src/lib/clickup-vacations.js.
export async function POST(request) {
  const raw = await request.text();

  // Verificación de firma HMAC-SHA256 (si hay secreto configurado en el entorno).
  const secret = process.env.CLICKUP_WEBHOOK_SECRET;
  if (secret) {
    const sig = request.headers.get("x-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
    }
  }

  let payload;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const { event, task_id } = payload || {};
  if (!task_id) return NextResponse.json({ ok: true });

  const res = await reconcileVacationFromClickUp(task_id, { deleted: event === "taskDeleted" });
  if (res?.ok && !res.skipped && res.action && res.action !== "nochange") {
    revalidatePath("/calendario");
    revalidatePath("/admin");
    revalidatePath("/mi-espacio");
  }
  return NextResponse.json({ ok: true, event, ...res });
}
