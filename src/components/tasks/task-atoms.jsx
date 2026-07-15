"use client";

// Átomos de tarea COMPARTIDOS (fila, estado, avatares) — misma pieza en /tareas
// y en el inicio, para un diseño unificado. Campos ClickUp.
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { dueLabel } from "@/lib/clickup-ui";
import { getListStatuses } from "@/lib/actions/clickup";
import { TEAM } from "@/lib/mock";
import { FctsAsterisk } from "@/components/FctsMark";

const PHOTO = new Map(TEAM.filter((m) => m.email).map((m) => [m.email, m]));

// Foto del miembro del equipo por email (para avatares mini fuera de <Avatars>).
export const teamPhoto = (email) => (email ? PHOTO.get(email)?.photo || null : null);

export function Avatars({ assignees }) {
  if (!assignees?.length) return <span className="text-micro text-mutedSoft/70 hidden sm:inline">—</span>;
  return (
    <div className="flex -space-x-1.5">
      {assignees.slice(0, 3).map((a, i) => {
        if (a.team) return (
          <span key={i} title="Todo el equipo" className="w-6 h-6 rounded-full grid place-items-center ring-2 ring-bg bg-ink text-bg">
            <FctsAsterisk className="h-3 w-3" />
          </span>
        );
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
export function StatusMenu({ current, color, statuses = [], listId, onPick, done, variant = "pill", align = "left", milestone = false }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(statuses);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const list = loaded.length ? loaded : statuses;

  // Cierre robusto: clic fuera o Escape (no depende de un overlay `fixed`, que
  // se rompe si hay un ancestro con transform —animaciones de Inicio, etc.).
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown, true); document.removeEventListener("keydown", onKey); };
  }, [open]);
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
    <div className="relative shrink-0" ref={ref}>
      {variant === "dot" ? (
        <button
          type="button"
          onClick={toggle}
          title={`${milestone ? "Hito · " : ""}${current} — cambiar`}
          className="h-[18px] w-[18px] grid place-items-center transition active:scale-90"
        >
          {/* Hito → diamante; tarea normal → círculo. */}
          <span
            className={cn(
              "grid place-items-center transition hover:ring-2 hover:ring-border",
              milestone ? "h-3 w-3 rotate-45 rounded-[3px]" : "h-[18px] w-[18px] rounded-full"
            )}
            style={done ? { background: dot } : { boxShadow: `inset 0 0 0 2px ${dot}` }}
          >
            {done && !milestone && <svg className="text-bg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </span>
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

// Fila de tarea unificada. El cluster izquierdo (caret + estado + nombre) es UNA
// celda que se indenta en las subtareas; las columnas de la derecha (área, fecha,
// asignados) son fijas para que coincidan siempre entre padres y subtareas.
// La columna Área solo se muestra a admins (el resto solo ve listas "Tareas").
const ROW = "grid grid-cols-[minmax(0,1fr)_132px_92px_84px] gap-3 items-center px-3 py-2.5 rounded-lg hover:bg-surface2/40 transition-colors";
const ROW_NO_AREA = "grid grid-cols-[minmax(0,1fr)_92px_84px] gap-3 items-center px-3 py-2.5 rounded-lg hover:bg-surface2/40 transition-colors";

// showCaret: reserva el hueco del caret de subtareas para alinear filas. En
// listas sin desplegables (p. ej. el Status de Inicio) se puede quitar.
export function TaskRow({ t, eff, open, statuses, onPickStatus, onOpen, active, depth = 0, hasSubtasks = false, expanded = false, onToggle, showArea = true, showCaret = true }) {
  const due = dueLabel(t.dueDate);
  const nameCls = cn("min-w-0 text-small text-ink hover:text-brand transition-colors truncate text-left", !open && "line-through text-mutedSoft");
  // Indenta el cluster izquierdo completo (caret+estado+nombre) según profundidad.
  const indent = depth ? { paddingLeft: depth * 24 } : undefined;
  return (
    <div
      className={cn(showArea ? ROW : ROW_NO_AREA, active && "bg-surface2/60", onOpen && "cursor-pointer")}
      onClick={onOpen ? () => onOpen(t) : undefined}
    >
      <div className="flex items-center gap-3 min-w-0" style={indent}>
        {hasSubtasks ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
            aria-label={expanded ? "Contraer subtareas" : "Desplegar subtareas"}
            className="h-4 w-4 shrink-0 grid place-items-center text-mutedSoft hover:text-ink transition active:scale-90"
          >
            <svg className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        ) : showCaret ? (
          <span className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        <StatusMenu variant="dot" current={eff.status} color={eff.statusColor} done={!open} statuses={statuses} listId={t.listId} onPick={(s) => onPickStatus(t.id, s)} milestone={t.isMilestone} />
        {onOpen ? (
          // La fila entera es clicable; el nombre es texto (no un botón anidado).
          <span className={nameCls}>{t.name}</span>
        ) : (
          <a
            href={t.url && t.url !== "#" ? t.url : undefined}
            target={t.url && t.url !== "#" ? "_blank" : undefined}
            rel="noreferrer"
            className={nameCls}
          >
            {t.name}
          </a>
        )}
        {t.resources?.length > 0 && (
          <svg className="h-3.5 w-3.5 shrink-0 text-mutedSoft/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-label="Tiene recursos"><title>Tiene recursos</title><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        )}
      </div>
      {showArea && <span className="text-micro text-mutedSoft truncate">{t.listName || "—"}</span>}
      <span className={cn("text-micro text-right tabular-nums", due.tone)}>{due.text}</span>
      <div className="justify-self-end"><Avatars assignees={t.assignees} /></div>
    </div>
  );
}
