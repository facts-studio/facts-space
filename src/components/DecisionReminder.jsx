"use client";

import { useState, useTransition } from "react";
import { Surface } from "@/components/ui";
import { absenceLabel } from "@/lib/absences";
import { markDecisionsSeen } from "@/lib/actions/vacations";

// "2 jul" / "2–6 jul" / "28 jun – 3 jul"
const d = (iso) => new Date(iso + "T00:00:00");
const short = (iso) => d(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
function range(start, end) {
  if (!end || end === start) return short(start);
  const a = d(start), b = d(end);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${short(end)}`;
  return `${short(start)} – ${short(end)}`;
}

/**
 * Aviso al solicitante cuando su responsable resuelve una ausencia. Se queda
 * hasta que lo descarta (× ), que es cuando se marca vista en BBDD.
 * decisions: [{ id, type, start_date, end_date, status, decision_note }]
 */
export default function DecisionReminder({ decisions = [] }) {
  const [hidden, setHidden] = useState(() => new Set());
  const [, start] = useTransition();

  const visible = decisions.filter((x) => !hidden.has(x.id));
  if (!visible.length) return null;

  const dismiss = (id) => {
    setHidden((s) => new Set(s).add(id)); // optimista
    start(async () => { await markDecisionsSeen([id]); });
  };

  return visible.map((x) => {
    const ok = x.status === "approved";
    const nota = x.decision_note?.trim();
    return (
      <Surface key={x.id} variant="raised" pad="none" className="rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[14px] leading-none opacity-70">{ok ? "✅" : "❌"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-small text-ink">
              Tu solicitud de {absenceLabel(x.type).toLowerCase()} ({range(x.start_date, x.end_date)}){" "}
              {ok ? "ha sido aprobada" : "ha sido rechazada"}
            </p>
            {nota && <p className="text-micro text-mutedSoft truncate">«{nota}»</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(x.id)}
            className="ml-auto shrink-0 text-small text-muted font-medium hover:text-ink transition"
          >
            Vale
          </button>
        </div>
      </Surface>
    );
  });
}
