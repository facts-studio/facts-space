"use client";

import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui";
import { closeClickUpTask } from "@/lib/actions/clickup";
import { dueLabel } from "@/lib/clickup-ui";

export default function TareasHoyList({ tasks }) {
  // done: ids cerradas optimistamente. error: id -> mensaje.
  const [done, setDone] = useState(() => new Set());
  const [errored, setErrored] = useState({});
  const [pendingId, setPendingId] = useState(null);
  const [, start] = useTransition();

  const visible = tasks.filter((t) => !done.has(t.id));
  if (visible.length === 0) return <EmptyState>Nada pendiente para hoy 🎉</EmptyState>;

  const complete = (id) => {
    setErrored((e) => ({ ...e, [id]: undefined }));
    setPendingId(id);
    setDone((s) => new Set(s).add(id)); // optimista
    start(async () => {
      const res = await closeClickUpTask(id);
      setPendingId(null);
      if (!res?.ok) {
        // Revertir si falló.
        setDone((s) => { const n = new Set(s); n.delete(id); return n; });
        setErrored((e) => ({ ...e, [id]: res?.error || "No se pudo cerrar" }));
      }
    });
  };

  return (
    <ul className="divide-y divide-border/50">
      {visible.map((t) => {
        const due = dueLabel(t.dueDate);
        const busy = pendingId === t.id;
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            {/* Completar → cierra en ClickUp */}
            <button
              onClick={() => complete(t.id)}
              disabled={busy}
              aria-label="Marcar como completada"
              title="Completar (se cierra en ClickUp)"
              className="group/check h-5 w-5 shrink-0 rounded-full border-2 border-borderStrong grid place-items-center text-ink transition hover:border-ink hover:bg-ink hover:text-bg disabled:opacity-40"
            >
              <span className="text-[10px] leading-none opacity-0 group-hover/check:opacity-100">✓</span>
            </button>

            <a
              href={t.url && t.url !== "#" ? t.url : undefined}
              target={t.url && t.url !== "#" ? "_blank" : undefined}
              rel="noreferrer"
              className="group min-w-0 flex-1 flex items-center gap-3"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: t.statusColor || "rgb(var(--ct-mutedSoft))" }}
                title={t.status}
              />
              <div className="min-w-0 flex-1">
                <p className="text-small text-ink truncate group-hover:text-brand transition-colors">{t.name}</p>
                <p className="text-micro text-mutedSoft truncate">
                  {[t.project, t.listName].filter(Boolean).join(" · ")}
                  {t.status && <> · {t.status}</>}
                  {errored[t.id] && <span className="text-danger"> · {errored[t.id]}</span>}
                </p>
              </div>
              {due && <span className={`text-micro shrink-0 ${due.tone}`}>{due.text}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
