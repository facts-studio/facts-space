"use client";

// Átomos de tarea COMPARTIDOS (fila, estado, avatares) — misma pieza en /tareas
// y en el inicio, para un diseño unificado. Campos ClickUp.
import { useState } from "react";
import { cn } from "@/lib/cn";
import { dueLabel } from "@/lib/clickup-ui";
import { getListStatuses } from "@/lib/actions/clickup";
import { TEAM } from "@/lib/mock";

const PHOTO = new Map(TEAM.filter((m) => m.email).map((m) => [m.email, m]));

// Foto del miembro del equipo por email (para avatares mini fuera de <Avatars>).
export const teamPhoto = (email) => (email ? PHOTO.get(email)?.photo || null : null);

export function Avatars({ assignees }) {
  if (!assignees?.length) return <span className="text-micro text-mutedSoft/70 hidden sm:inline">—</span>;
  return (
    <div className="flex -space-x-1.5">
      {assignees.slice(0, 3).map((a, i) => {
        const m = a.email ? PHOTO.get(a.email) : null;
        return m?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={m.photo} alt={a.name} title={a.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-bg" />
        ) : (
          <span key={i} title={a.name} className="w-6 h-6 rounded-full grid place-items-center text-[10px] text-bg ring-2 ring-bg" style={{ background: a.color || "rgb(var(--ct-mutedSoft))" }}>
            {(a.name || "?")[0]?.toUpperCase()}
          </span>
        );
      })}
      {assignees.length > 3 && <span className="w-6 h-6 rounded-full grid place-items-center text-[10px] text-mutedSoft bg-surface2 ring-2 ring-bg">+{assignees.length - 3}</span>}
    </div>
  );
}

// Fases de ClickUp (tipo → grupo), en orden.
const PHASES = [
  { label: "Not started", types: ["open", "unstarted"] },
  { label: "Active", types: ["custom", "active"] },
  { label: "Done", types: ["done"] },
  { label: "Closed", types: ["closed"] },
];

// Selector de estado: burbuja (dot) o pastilla (pill). Desplegable por fase;
// escribe el estado en ClickUp al elegir. Carga estados perezosamente si faltan.
export function StatusMenu({ current, color, statuses = [], listId, onPick, done, variant = "pill", align = "left" }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(statuses);
  const [loading, setLoading] = useState(false);
  const list = loaded.length ? loaded : statuses;
  const groups = PHASES
    .map((p) => ({ label: p.label, items: list.filter((s) => p.types.includes(s.type)) }))
    .filter((g) => g.items.length);
  const dot = color || "rgb(var(--ct-mutedSoft))";

  const toggle = async (e) => {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (next && !list.length && listId && !loading) {
      setLoading(true);
      const res = await getListStatuses(listId);
      setLoaded(res?.statuses || []);
      setLoading(false);
    }
  };

  return (
    <div className="relative shrink-0">
      {variant === "dot" ? (
        <button
          type="button"
          onClick={toggle}
          title={`${current} — cambiar`}
          className="h-[18px] w-[18px] rounded-full grid place-items-center transition active:scale-90 hover:ring-2 hover:ring-border"
          style={done ? { background: dot } : { boxShadow: `inset 0 0 0 2px ${dot}` }}
        >
          {done && <svg className="text-bg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          title="Cambiar estado"
          className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-micro max-w-[140px] transition hover:bg-surface2/70"
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dot }} />
          <span className="truncate text-mutedSoft capitalize">{current}</span>
        </button>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className={cn("absolute top-full mt-1 z-50 w-56 rounded-xl border border-border/60 bg-paper shadow-float p-1.5 max-h-[280px] overflow-y-auto", align === "right" ? "right-0" : "left-0")}>
            {loading && <div className="px-2 py-2 text-micro text-mutedSoft">Cargando estados…</div>}
            {!loading && !groups.length && <div className="px-2 py-2 text-micro text-mutedSoft">Sin estados disponibles.</div>}
            {groups.map((g) => (
              <div key={g.label} className="py-0.5">
                <div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-[0.12em] text-mutedSoft">{g.label}</div>
                {g.items.map((s) => (
                  <button
                    key={s.status}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen(false); onPick(s); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-small hover:bg-surface2/60 transition text-left"
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="flex-1 truncate capitalize text-ink">{s.status}</span>
                    {s.status === current && <span className="text-ink text-[11px]">✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Fila de tarea unificada: [burbuja estado] nombre · área · fecha · asignado.
const ROW = "grid grid-cols-[18px_minmax(0,1fr)_minmax(84px,150px)_92px_auto] gap-3 items-center px-3 py-2.5 rounded-lg hover:bg-surface2/40 transition-colors";

export function TaskRow({ t, eff, open, statuses, onPickStatus }) {
  const due = dueLabel(t.dueDate);
  return (
    <div className={ROW}>
      <StatusMenu variant="dot" current={eff.status} color={eff.statusColor} done={!open} statuses={statuses} listId={t.listId} onPick={(s) => onPickStatus(t.id, s)} />
      <a
        href={t.url && t.url !== "#" ? t.url : undefined}
        target={t.url && t.url !== "#" ? "_blank" : undefined}
        rel="noreferrer"
        className={cn("min-w-0 text-small text-ink hover:text-brand transition-colors truncate", !open && "line-through text-mutedSoft")}
      >
        {t.name}
      </a>
      <span className="text-micro text-mutedSoft truncate">{t.listName || "—"}</span>
      <span className={cn("text-micro text-right tabular-nums", due.tone)}>{due.text}</span>
      <Avatars assignees={t.assignees} />
    </div>
  );
}
