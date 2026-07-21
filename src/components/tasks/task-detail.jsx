"use client";

// Panel lateral de detalle de una tarea (sustituye al "abrir en ClickUp").
// Se muestra en la columna derecha de /tareas al seleccionar una tarea.
import { useState } from "react";
import { cn } from "@/lib/cn";
import { DataList, DataRow, Badge, Button } from "@/components/ui";
import { dueLabel, PRIORITY } from "@/lib/clickup-ui";
import { StatusMenu, Avatars, teamPhoto } from "@/components/tasks/task-atoms";

// Color suave del chip según el tipo de fichero (tokens del sistema).
const FILE_KIND = {
  pdf: "bg-dangerSoft/60 text-danger",
  zip: "bg-warnSoft/60 text-warn",
  rar: "bg-warnSoft/60 text-warn",
  doc: "bg-infoSoft/60 text-info",
  docx: "bg-infoSoft/60 text-info",
  txt: "bg-infoSoft/60 text-info",
  xls: "bg-successSoft/60 text-success",
  xlsx: "bg-successSoft/60 text-success",
  csv: "bg-successSoft/60 text-success",
  ppt: "bg-warnSoft/60 text-warn",
  pptx: "bg-warnSoft/60 text-warn",
  fig: "bg-violetSoft/60 text-violet",
};
const fileKind = (ext) => FILE_KIND[ext] || "bg-violetSoft/60 text-violet";

// Tamaño legible de fichero.
function fileSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

// Icono de Google Drive (marca).
function DriveIcon({ className }) {
  return (
    <svg viewBox="0 0 87.3 78" className={className} aria-hidden>
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

const isDriveUrl = (url) => /(?:^|\/\/|\.)(?:drive|docs)\.google\.com\//.test(url || "");

// Fila de recurso (fichero adjunto): Drive → icono Drive; imagen → miniatura;
// resto → chip de tipo con color suave.
function ResourceRow({ r }) {
  const isImg = (r.mimetype || "").startsWith("image/") && r.thumb;
  const isDrive = isDriveUrl(r.url);
  // Enlace pegado en la descripción: no es un fichero, así que ni badge de
  // extensión ni icono de descarga.
  const isLink = r.kind === "link";
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      title={r.title}
      className="flex items-center gap-2.5 py-2 group"
    >
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.thumb} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-border/60" />
      ) : isDrive ? (
        <span className="h-9 w-9 shrink-0 rounded-md bg-surface2/50 grid place-items-center">
          <DriveIcon className="h-4 w-4" />
        </span>
      ) : isLink ? (
        <span className="h-9 w-9 shrink-0 rounded-md bg-surface2/50 grid place-items-center text-mutedSoft">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        </span>
      ) : (
        <span className={cn("h-9 w-9 shrink-0 rounded-md grid place-items-center text-[9px] font-semibold uppercase", fileKind(r.ext))}>
          {r.ext || "file"}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-small text-ink truncate group-hover:text-brand transition">{r.title}</span>
        {r.size && <span className="block text-micro text-mutedSoft">{fileSize(r.size)}</span>}
      </span>
      {isLink ? (
        <svg className="h-4 w-4 shrink-0 text-mutedSoft group-hover:text-ink transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
      ) : (
        <svg className="h-4 w-4 shrink-0 text-mutedSoft group-hover:text-ink transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      )}
    </a>
  );
}

// Fila compacta de subtarea dentro del panel.
function SubtaskRow({ s, active, onOpen }) {
  const col = s.statusColor || "rgb(var(--ct-mutedSoft))";
  const a = s.assignees?.[0];
  const photo = a ? teamPhoto(a.email) : null;
  const doneS = s.statusType === "closed" || s.statusType === "done";
  return (
    <button
      type="button"
      onClick={() => onOpen?.(s)}
      className={cn("w-full flex items-center gap-2.5 py-2 text-left rounded-lg px-1.5 transition hover:bg-surface2/50", active && "bg-surface2/60")}
    >
      <span className="h-3 w-3 rounded-full border-[1.6px] shrink-0" style={{ borderColor: col }} title={s.status} />
      <span className={cn("min-w-0 flex-1 text-small truncate", doneS ? "text-mutedSoft line-through" : "text-ink")}>{s.name}</span>
      {a && (photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={a.name} title={a.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
      ) : (
        <span title={a.name} className="h-5 w-5 rounded-full grid place-items-center text-[9px] text-bg shrink-0" style={{ background: a.color || "rgb(var(--ct-mutedSoft))" }}>{(a.name || "?")[0]?.toUpperCase()}</span>
      ))}
    </button>
  );
}

export default function TaskDetail({ t, eff, open, statuses, onPickStatus, onOpen, selectedId, isAdmin = false, onClose }) {
  const [subsOpen, setSubsOpen] = useState(true);
  const due = dueLabel(t.dueDate);
  const prio = t.priority ? PRIORITY[t.priority] : null;
  // Abrir en ClickUp es solo para admins.
  const hasClickUp = isAdmin && t.url && t.url !== "#";
  const subtasks = t.subtasks ?? [];

  return (
    <aside className="mt-4 lg:mt-0 lg:sticky lg:top-16 slide-in rounded-2xl border border-border/50 bg-surface/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <StatusMenu
          variant="pill"
          current={eff.status}
          color={eff.statusColor}
          done={!open}
          statuses={statuses}
          listId={t.listId}
          onPick={(s) => onPickStatus(t.id, s)}
        />
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="h-7 w-7 grid place-items-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition"
        >
          ✕
        </button>
      </div>

      {t.parentId && (
        <span className="inline-flex items-center gap-1 text-micro text-mutedSoft mb-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 4v8a4 4 0 0 0 4 4h12" /><path d="m16 12 4 4-4 4" /></svg>
          Subtarea
        </span>
      )}
      <h3 className="font-display text-[19px] leading-snug text-ink mb-3">{t.name}</h3>

      <DataList>
        {t.project && (
          <DataRow label="Cliente" value={<Badge kind="neutral">{t.project}</Badge>} />
        )}
        {t.listName && <DataRow label="Área" value={t.listName} />}
        <DataRow
          label="Vence"
          value={<span className={due.tone}>{due.text}</span>}
        />
        {prio && prio.label !== "Normal" && (
          <DataRow label="Prioridad" value={<span className={prio.tone}>{prio.label}</span>} />
        )}
        <DataRow
          label="Asignados"
          value={<Avatars assignees={t.assignees} />}
        />
      </DataList>

      {t.description && (
        <div className="mt-4">
          <p className="section-eyebrow mb-1.5">Descripción</p>
          <p className="text-small text-muted whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">
            {t.description}
          </p>
        </div>
      )}

      {t.resources?.length > 0 && (
        <div className="mt-4">
          <p className="section-eyebrow mb-1.5">Recursos</p>
          <div className="divide-y divide-border/40">
            {t.resources.map((r) => (
              <ResourceRow key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setSubsOpen((o) => !o)}
            className="w-full flex items-center gap-2 group"
          >
            <svg className={cn("h-3 w-3 text-mutedSoft transition-transform", subsOpen && "rotate-90")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            <span className="section-eyebrow group-hover:text-ink transition-colors">Subtareas</span>
            <span className="text-micro text-mutedSoft tabular-nums">{subtasks.length}</span>
          </button>
          {subsOpen && (
            <div className="mt-1 divide-y divide-border/40">
              {subtasks.map((s) => (
                <SubtaskRow key={s.id} s={s} active={s.id === selectedId} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      )}

      {hasClickUp && (
        <div className="mt-5">
          <Button as="a" href={t.url} target="_blank" rel="noreferrer" variant="ghost" size="sm" className="w-full justify-center">
            Abrir en ClickUp ↗
          </Button>
        </div>
      )}
    </aside>
  );
}
