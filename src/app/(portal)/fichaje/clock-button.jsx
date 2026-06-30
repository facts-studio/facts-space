"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clockIn, clockOut } from "@/lib/actions/time";
import { formatDuration, madridTime } from "@/lib/dates";

// Botón de fichar entrada/salida con cronómetro en vivo de la jornada actual.
// `open` = { id, clock_in } si hay jornada abierta. `closedTodayMs` = suma de
// las jornadas ya cerradas hoy.
export default function ClockButton({ open, closedTodayMs = 0 }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const elapsed = open ? now - new Date(open.clock_in).getTime() : 0;
  const totalToday = closedTodayMs + Math.max(0, elapsed);

  const toggle = () => {
    setErr(null);
    startTransition(async () => {
      const res = await (open ? clockOut() : clockIn());
      if (!res.ok) setErr(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="section-eyebrow mb-2">Hoy</p>
          <p className="font-display text-[40px] leading-none text-ink tabular-nums">
            {formatDuration(totalToday)}
          </p>
          <p className="text-small text-muted mt-2">
            {open ? (
              <>Trabajando desde las <span className="text-ink">{madridTime(open.clock_in)}</span></>
            ) : (
              "Sin jornada abierta"
            )}
          </p>
        </div>

        <button
          onClick={toggle}
          disabled={pending}
          className={`h-12 px-7 rounded-xl text-[15px] font-medium inline-flex items-center gap-2.5 transition active:scale-[0.99] disabled:opacity-60 ${
            open
              ? "border border-borderStrong/60 bg-surface2/50 text-ink hover:bg-surface2"
              : "bg-ink text-bg hover:brightness-[0.96]"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${open ? "bg-danger animate-pulse" : "bg-bg/70"}`} />
          {pending ? "…" : open ? "Fichar salida" : "Fichar entrada"}
        </button>
      </div>
      {err && <p className="text-micro text-danger mt-3">{err}</p>}
    </div>
  );
}
