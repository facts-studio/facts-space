"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { setClickUpTaskStatus } from "@/lib/actions/clickup";
import { dueLabel } from "@/lib/clickup-ui";
import { StatusMenu } from "@/components/tasks/task-atoms";

export default function TareasHoyList({ tasks, isAdmin = false }) {
  // done: ids completadas (ocultas optimistamente). overrides: estado local por id.
  const [done, setDone] = useState(() => new Set());
  const [overrides, setOverrides] = useState(() => new Map());
  const [, start] = useTransition();

  const visible = tasks.filter((t) => !done.has(t.id));
  if (visible.length === 0) return <EmptyState>Nada pendiente para hoy 🎉</EmptyState>;

  const eff = (t) => overrides.get(t.id) || { status: t.status, statusType: t.statusType, statusColor: t.statusColor };
  const isOpen = (t) => { const s = eff(t).statusType; return s !== "closed" && s !== "done"; };

  // Cambiar estado desde el círculo (igual que en /tareas). Completar oculta la fila.
  const pick = (t, s) => {
    const prevOv = overrides.get(t.id);
    setOverrides((m) => { const n = new Map(m); n.set(t.id, { status: s.status, statusType: s.type, statusColor: s.color }); return n; });
    const closes = s.type === "closed" || s.type === "done";
    if (closes) setDone((d) => new Set(d).add(t.id)); // optimista
    start(async () => {
      const res = await setClickUpTaskStatus(t.id, s.status);
      if (!res?.ok) {
        // Revertir.
        setOverrides((m) => { const n = new Map(m); if (prevOv) n.set(t.id, prevOv); else n.delete(t.id); return n; });
        if (closes) setDone((d) => { const n = new Set(d); n.delete(t.id); return n; });
      }
    });
  };

  return (
    <ul className="divide-y divide-border/50">
      {visible.map((t) => {
        const e = eff(t);
        const due = dueLabel(t.dueDate);
        const clickHref = t.url && t.url !== "#" ? t.url : null;
        // Admin → abre ClickUp; resto → /tareas con la tarea abierta en el panel.
        const rowCls = "group min-w-0 flex-1 flex items-center gap-3";
        const inner = (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-small text-ink truncate group-hover:text-brand transition-colors flex items-center gap-1.5">
                {t.isSubtask && (
                  <span
                    title={t.parentName ? `Subtarea de «${t.parentName}»` : "Subtarea"}
                    className="shrink-0 inline-flex items-center gap-0.5 text-micro text-mutedSoft bg-surface2 rounded px-1 leading-[1.4]"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 4v8a4 4 0 0 0 4 4h12" /><path d="m16 12 4 4-4 4" /></svg>
                    sub
                  </span>
                )}
                <span className="truncate">{t.name}</span>
              </p>
              <p className="text-micro text-mutedSoft truncate">
                {t.isSubtask && t.parentName
                  ? `de «${t.parentName}»`
                  : [t.project, t.listName].filter(Boolean).join(" · ")}
                {e.status && <> · {e.status}</>}
              </p>
            </div>
            {due && <span className={`text-micro shrink-0 ${due.tone}`}>{due.text}</span>}
          </>
        );
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            {/* Círculo de estado (unificado con /tareas): marca y cambia el estado. */}
            <StatusMenu variant="dot" current={e.status} color={e.statusColor} done={!isOpen(t)} listId={t.listId} onPick={(s) => pick(t, s)} milestone={t.isMilestone} />

            {isAdmin ? (
              <a href={clickHref ?? undefined} target={clickHref ? "_blank" : undefined} rel="noreferrer" className={rowCls}>
                {inner}
              </a>
            ) : (
              <Link href={`/tareas?task=${t.id}`} className={rowCls}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
