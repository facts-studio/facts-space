"use client";

// Tablero de UN sprint: sus tareas en columnas por estado. Es lo que ve alguien
// que solo trabaja en ese proyecto —un colaborador— y el atajo para cualquiera
// que quiera el sprint suelto sin el tablero entero del estudio.
import { useMemo } from "react";
import { Surface, Badge, ProgressBar, EmptyState } from "@/components/ui";
import { Avatars } from "@/components/tasks/task-atoms";
import { dueLabel } from "@/lib/clickup-ui";

const VERDE = { bg: "rgb(var(--ct-success) / 0.20)", stripe: "rgb(var(--ct-success) / 0.42)" };
const dm = (ts) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");

function Card({ t }) {
  const due = dueLabel(t.dueDate, undefined, t.dueHasTime);
  return (
    <a
      href={t.url && t.url !== "#" ? t.url : undefined}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl bg-surface p-3 transition hover:shadow-soft"
    >
      <p className="text-small text-ink leading-snug">{t.name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Avatars assignees={t.assignees} />
        {due && <span className={`text-micro shrink-0 ${due.tone}`}>{due.text}</span>}
      </div>
    </a>
  );
}

export default function SprintBoard({ sprint, tasks = [], statuses = [] }) {
  // Columnas: los estados que la lista declara en ClickUp, en su orden. Si no
  // hay configuración, se sacan de las propias tareas para no quedarse en blanco.
  const columnas = useMemo(() => {
    const nombres = statuses.length
      ? statuses.map((s) => s.status)
      : [...new Set(tasks.map((t) => t.status).filter(Boolean))];
    const color = new Map(statuses.map((s) => [s.status, s.color]));
    return nombres
      .map((nombre) => ({
        nombre,
        color: color.get(nombre) ?? null,
        items: tasks.filter((t) => t.status === nombre),
      }))
      .filter((c) => c.items.length);
  }, [statuses, tasks]);

  const hechas = tasks.filter((t) => t.statusType === "closed" || t.statusType === "done").length;
  const pct = tasks.length ? Math.round((hechas / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Surface variant="raised" pad="none" className="rounded-[28px] p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {sprint.client && <Badge kind="neutral">{sprint.client}</Badge>}
          {sprint.start && sprint.due && <Badge kind="neutral">{dm(sprint.start)} – {dm(sprint.due)}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar value={pct} tint={VERDE} className="flex-1" label={`Progreso: ${pct}%`} />
          <span className="shrink-0 text-micro text-mutedSoft tabular-nums">{hechas}/{tasks.length}</span>
        </div>
        {sprint.note && <p className="mt-4 text-small text-muted leading-relaxed whitespace-pre-line">{sprint.note}</p>}
      </Surface>

      {columnas.length === 0 ? (
        <EmptyState>Este sprint aún no tiene tareas.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {columnas.map((c) => (
            <Surface key={c.nombre} variant="muted" pad="sm" className="space-y-2">
              <div className="flex items-center gap-2 px-1 pb-1">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color || "rgb(var(--ct-mutedSoft))" }} />
                <p className="text-micro uppercase tracking-wide text-mutedSoft flex-1 truncate">{c.nombre}</p>
                <span className="text-micro text-mutedSoft tabular-nums">{c.items.length}</span>
              </div>
              {c.items.map((t) => <Card key={t.id} t={t} />)}
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
