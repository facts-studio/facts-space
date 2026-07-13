"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Surface, Tabs, Switch, EmptyState, ScreenHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dueLabel, PRIORITY } from "@/lib/clickup-ui";
import { setClickUpTaskStatus, refreshClickUpTasks } from "@/lib/actions/clickup";
import { clientIcon } from "@/lib/client-icons";
import { paletteColor } from "@/lib/client-palette";
import { TaskRow, StatusMenu, Avatars, teamPhoto } from "@/components/tasks/task-atoms";
import TaskDetail from "@/components/tasks/task-detail";


// Busca una tarea por id, incluyendo subtareas anidadas.
function findTaskById(list, id) {
  if (!id) return null;
  for (const t of list) {
    if (t.id === id) return t;
    const found = t.subtasks && findTaskById(t.subtasks, id);
    if (found) return found;
  }
  return null;
}

// Horizonte temporal para el switch de fecha.
const SCOPES = [
  { key: "todo", label: "Todo" },
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mes" },
];
function matchScope(t, scope) {
  if (scope === "todo") return true;
  if (!t.dueDate) return false;
  const now = Date.now();
  const day = 86400000;
  const start = new Date(now).setHours(0, 0, 0, 0);
  const horizon = scope === "hoy" ? start + day : scope === "semana" ? start + 7 * day : start + 30 * day;
  return t.dueDate < horizon; // incluye vencidas + lo que cae en el horizonte
}

/* ── Átomos ─────────────────────────────────────────────────────────────── */

const SearchIcon = () => (
  <svg className="h-[16px] w-[16px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);

// Buscador colapsable: icono que se despliega a campo (para caber en 1 línea).
function SearchField({ value, onChange }) {
  const [open, setOpen] = useState(Boolean(value));
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} title="Buscar" aria-label="Buscar" className="h-9 w-9 shrink-0 grid place-items-center rounded-lg border border-border text-mutedSoft hover:text-ink hover:border-borderStrong transition">
        <SearchIcon />
      </button>
    );
  }
  return (
    <div className="h-9 w-[200px] shrink-0 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 text-mutedSoft focus-within:border-borderStrong transition">
      <SearchIcon />
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => { if (!value) setOpen(false); }} placeholder="Buscar…" className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-mutedSoft text-ink" />
      {value && <button onClick={() => onChange("")} aria-label="Limpiar" className="text-mutedSoft hover:text-ink text-[16px] leading-none active:scale-90 transition shrink-0">×</button>}
    </div>
  );
}

// Avatar de cliente/campaña (visual puro). Muestra el icono si existe; si no,
// tinte + inicial. El apilado, hover y tooltip los gestiona la fila.
function ClientAvatar({ name, active, campaign, todos, icon, colorKey }) {
  const c = todos ? null : paletteColor(name, colorKey);
  const initial = todos ? null : (name || "?").trim()[0]?.toUpperCase();
  return (
    <span className="relative block">
      <span
        className={cn(
          "grid place-items-center rounded-[13px] w-10 h-10 font-display text-[15px] transition",
          active ? "ring-2 ring-ink" : "ring-1 ring-border/60",
          todos && (active ? "bg-ink text-bg" : "bg-surface2/70 text-muted")
        )}
        style={!todos && c ? { background: c.bg, color: c.fg } : undefined}
      >
        {icon ? (
          // Icono monocromo teñido con el fg del cliente (misma lógica que la letra).
          <span
            aria-hidden
            className="block h-[52%] w-[52%]"
            style={{
              backgroundColor: c?.fg,
              WebkitMaskImage: `url("${icon}")`,
              maskImage: `url("${icon}")`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        ) : todos ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        ) : initial}
      </span>
      {campaign && <span className="absolute -top-1 -right-1 text-brandMid text-[11px] leading-none drop-shadow-sm">✦</span>}
    </span>
  );
}

// ── Vista Calendario (mes) ──────────────────────────────────────────────────
const ISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const thisMonth = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; };
const todayISO = () => ISO(new Date());
function monthMatrix(y, m) {
  const first = new Date(y, m, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // lunes como inicio
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    return { iso: ISO(d), day: d.getDate(), inMonth: d.getMonth() === m };
  });
}
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const MAX_LANES = 3;
// Reparte las tareas de una semana en carriles (lanes) sin solaparse, como barras.
function weekBars(weekDates, tasks) {
  const wStart = weekDates[0].iso, wEnd = weekDates[6].iso;
  const idx = new Map(weekDates.map((d, i) => [d.iso, i]));
  const near = (iso, fallbackIdx) => (idx.has(iso) ? idx.get(iso) : fallbackIdx);
  const segs = [];
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const s = ISO(new Date(t.startDate && t.startDate < t.dueDate ? t.startDate : t.dueDate));
    const e = ISO(new Date(t.dueDate));
    if (s > wEnd || e < wStart) continue; // no toca esta semana
    const a = s < wStart ? 0 : near(s, 0);
    const b = e > wEnd ? 6 : near(e, 6);
    segs.push({ t, a, b, contPrev: s < wStart, contNext: e > wEnd });
  }
  segs.sort((x, y) => x.a - y.a || y.b - y.b);
  const lanes = []; // cada lane = array de segmentos colocados
  for (const seg of segs) {
    let placed = false;
    for (const lane of lanes) {
      if (lane.every((o) => seg.a > o.b || seg.b < o.a)) { lane.push(seg); seg.lane = lanes.indexOf(lane); placed = true; break; }
    }
    if (!placed) { seg.lane = lanes.length; lanes.push([seg]); }
  }
  return segs;
}

function CalendarView({ tasks, colorsByClient = {}, onOpen }) {
  const [cur, setCur] = useState(thisMonth);
  const [selDay, setSelDay] = useState(null); // iso del día seleccionado
  const cells = useMemo(() => monthMatrix(cur.y, cur.m), [cur]);
  const today = todayISO();
  const shift = (delta) => setCur((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const weeks = [0, 1, 2, 3, 4, 5].map((w) => cells.slice(w * 7, w * 7 + 7));
  // Tareas cuyo rango [inicio, fin] incluye el día seleccionado.
  const dayList = useMemo(() => {
    if (!selDay) return [];
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const s = ISO(new Date(t.startDate && t.startDate < t.dueDate ? t.startDate : t.dueDate));
      const e = ISO(new Date(t.dueDate));
      return s <= selDay && e >= selDay;
    }).sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  }, [tasks, selDay]);
  const selLabel = selDay ? (() => { const d = new Date(selDay + "T00:00:00"); return `${d.getDate()} de ${MONTHS[d.getMonth()]}`; })() : "";

  return (
    <Surface pad="sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[22px] text-ink capitalize leading-none">
          {MONTHS[cur.m]} <span className="text-mutedSoft text-[15px] tabular-nums">{cur.y}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setCur(thisMonth())} className="px-3 h-8 rounded-lg text-[12.5px] text-inkSoft hover:bg-surface2/60 transition">Hoy</button>
          <button onClick={() => shift(-1)} aria-label="Mes anterior" className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:bg-surface2/60 transition">‹</button>
          <button onClick={() => shift(1)} aria-label="Mes siguiente" className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:bg-surface2/60 transition">›</button>
        </div>
      </div>

      <div className={cn(selDay && "lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-4 lg:items-start")}>
        <div className="min-w-0">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => <div key={w} className="text-center text-micro text-mutedSoft">{w}</div>)}
      </div>

      <div className="flex flex-col gap-1 h-[calc(100vh-15rem)] min-h-[540px]">
        {weeks.map((week, wi) => {
          const segs = weekBars(week, tasks);
          const lanes = Math.min(MAX_LANES, Math.max(0, ...segs.map((s) => s.lane + 1), 0));
          const shown = segs.filter((s) => s.lane < MAX_LANES);
          const extra = week.map((d, i) => segs.filter((s) => s.lane >= MAX_LANES && s.a <= i && s.b >= i).length);
          return (
            <div key={wi} className="relative flex-1 min-h-[88px]">
              {/* Fondo de días: número anclado arriba, altura completa de la fila */}
              <div className="grid grid-cols-7 gap-1 h-full">
                {week.map((c) => (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => setSelDay((d) => (d === c.iso ? null : c.iso))}
                    className={cn("flex flex-col items-start h-full rounded-xl border bg-surface/40 pt-1.5 px-1.5 transition hover:border-borderStrong", !c.inMonth && "opacity-40", c.iso === selDay ? "border-ink/40 bg-surface/70" : "border-border/60")}
                  >
                    <span className={cn("inline-grid place-items-center h-5 w-5 rounded-full text-micro tabular-nums", c.iso === today ? "bg-ink text-bg font-semibold" : "text-mutedSoft")}>{c.day}</span>
                  </button>
                ))}
              </div>
              {/* Barras — capa superpuesta DEBAJO de los números, alineada a la rejilla */}
              <div className="absolute inset-x-0 top-[30px] space-y-1 pointer-events-none">
                {Array.from({ length: lanes }).map((_, laneIdx) => (
                  <div key={laneIdx} className="grid grid-cols-7 gap-1">
                    {shown.filter((s) => s.lane === laneIdx).map((s) => {
                      const t = s.t;
                      const col = t.statusColor || "rgb(var(--ct-mutedSoft))";
                      const a = t.assignees?.[0];
                      const photo = a ? teamPhoto(a.email) : null;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onOpen?.(t)}
                          title={`${t.name}${a ? ` · ${a.name}` : ""}${t.project ? ` · ${t.project}` : ""} · ${t.status}`}
                          style={{ gridColumn: `${s.a + 1} / span ${s.b - s.a + 1}`, background: col + "24" }}
                          className={cn(
                            "pointer-events-auto flex items-center gap-1.5 h-[24px] px-2 mx-1.5 text-[11.5px] leading-none text-ink hover:brightness-95 transition backdrop-blur-sm text-left",
                            s.contPrev ? "rounded-l-none" : "rounded-l-lg", s.contNext ? "rounded-r-none" : "rounded-r-lg"
                          )}
                        >
                          {/* Estado (aro tipo checkbox) */}
                          <span className="h-3 w-3 rounded-full border-[1.6px] shrink-0" style={{ borderColor: col }} />
                          <span className="truncate flex-1">{t.name}</span>
                          {/* Persona asignada */}
                          {a && (photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt={a.name} className="h-4 w-4 rounded-full object-cover shrink-0 ring-1 ring-bg" />
                          ) : (
                            <span className="h-4 w-4 rounded-full grid place-items-center text-[8px] text-bg shrink-0 ring-1 ring-bg bg-mutedSoft">{(a.name || "?")[0]?.toUpperCase()}</span>
                          ))}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {extra.some((n) => n > 0) && (
                  <div className="grid grid-cols-7 gap-1">
                    {extra.map((n, i) => <div key={i} className="text-[10px] text-mutedSoft px-1.5">{n > 0 ? `+${n}` : ""}</div>)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </div>

        {/* Columna de detalle del día seleccionado */}
        {selDay && (
          <aside className="mt-4 lg:mt-0 lg:sticky lg:top-16 slide-in rounded-2xl border border-border/50 bg-surface/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-title text-ink capitalize leading-none">{selLabel}</h4>
              <button onClick={() => setSelDay(null)} aria-label="Cerrar" className="h-7 w-7 grid place-items-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">✕</button>
            </div>
            {dayList.length === 0 ? (
              <p className="text-small text-mutedSoft py-6 text-center">Sin tareas este día.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {dayList.map((t) => {
                  const col = t.statusColor || "rgb(var(--ct-mutedSoft))";
                  const a = t.assignees?.[0];
                  const photo = a ? teamPhoto(a.email) : null;
                  return (
                    <div key={t.id} className="py-2.5 flex items-start gap-2.5">
                      <span className="h-3.5 w-3.5 mt-0.5 rounded-full border-[1.6px] shrink-0" style={{ borderColor: col }} title={t.status} />
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => onOpen?.(t)} className="text-small text-ink hover:text-brand transition block truncate text-left w-full">{t.name}</button>
                        <p className="text-micro text-mutedSoft truncate">{[t.project, t.status].filter(Boolean).join(" · ")}</p>
                      </div>
                      {a && (photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt={a.name} title={a.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <span title={a.name} className="h-6 w-6 rounded-full grid place-items-center text-[10px] text-bg shrink-0 bg-mutedSoft">{(a.name || "?")[0]?.toUpperCase()}</span>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        )}
      </div>
    </Surface>
  );
}

function Section({ label, count, campaign, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2 group">
        <svg className={cn("h-3 w-3 text-mutedSoft transition-transform", open ? "rotate-90" : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        {campaign && <span className="text-brandMid text-[11px]" title="Campaña">✦</span>}
        <span className="section-eyebrow group-hover:text-ink transition-colors">{label}</span>
        <span className="text-micro text-mutedSoft tabular-nums">{count}</span>
      </button>
      {open && <div className="mt-0.5">{children}</div>}
    </div>
  );
}

/* ── Pantalla ───────────────────────────────────────────────────────────── */

export default function TareasClient({ tasks, myEmail, isAdmin = false, visibleCount, campaigns = [], statusesByList = {}, iconsByClient = {}, colorsByClient = {} }) {
  const [q, setQ] = useState("");
  const [clientSet, setClientSet] = useState(() => new Set()); // multi-selección de clientes/campañas
  const [hoverCtx, setHoverCtx] = useState(null); // tooltip por portal {name,count,x,y}
  const [area, setArea] = useState(""); // "" = todas las disciplinas
  const [showClosed, setShowClosed] = useState(false); // false = solo abiertas
  const [scope, setScope] = useState("all"); // all | mine
  const myPhoto = teamPhoto(myEmail);
  const [tscope, setTscope] = useState("todo"); // todo | hoy | semana | mes
  const cycleTscope = () => { const i = SCOPES.findIndex((s) => s.key === tscope); setTscope(SCOPES[(i + 1) % SCOPES.length].key); };
  const [view, setView] = useState("lista"); // lista | tablero
  // Tarea abierta en el panel derecho; se puede preseleccionar vía ?task=id
  // (deep-link desde Inicio para el equipo no-admin).
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(() => searchParams.get("task"));
  const openTask = (t) => setSelectedId(t.id);
  const [expanded, setExpanded] = useState(() => new Set()); // ids con subtareas desplegadas
  const toggleExpand = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [overrides, setOverrides] = useState(() => new Map()); // id → {status,statusType,statusColor} (optimista)
  const [undo, setUndo] = useState(null); // {id, st, prev} — toast de deshacer completada
  const undoRef = useRef(null);
  const [, start] = useTransition();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    start(async () => { await refreshClickUpTasks(); router.refresh(); setTimeout(() => setRefreshing(false), 600); });
  };

  const campaignSet = useMemo(() => new Set(campaigns), [campaigns]);
  const eff = (t) => overrides.get(t.id) || { status: t.status, statusType: t.statusType, statusColor: t.statusColor };
  const isOpen = (t) => { const s = eff(t).statusType; return s !== "closed" && s !== "done"; };
  const toggleClient = (name) => setClientSet((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  // Clientes/campañas con tareas abiertas, ordenados por nº (más activos primero).
  const clients = useMemo(() => {
    const cnt = new Map();
    for (const t of tasks) {
      if (t.statusType === "closed" || t.statusType === "done") continue;
      if (t.project) cnt.set(t.project, (cnt.get(t.project) || 0) + 1);
    }
    return [...cnt.keys()]
      .map((name) => ({ name, count: cnt.get(name), campaign: campaignSet.has(name) }))
      // Clientes fijos primero (por nº de tareas), campañas/lanzamientos al final.
      .sort((a, b) => (a.campaign - b.campaign) || (b.count - a.count) || a.name.localeCompare(b.name));
  }, [tasks, campaignSet]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return tasks.filter((t) => {
      // Oculta cerradas si el switch está off, PERO mantiene las que acabas de
      // tocar (override) para que no desaparezcan de golpe al completarlas.
      if (!showClosed && !isOpen(t) && !overrides.has(t.id)) return false;
      if (!matchScope(t, tscope)) return false;
      if (clientSet.size && !clientSet.has(t.project)) return false;
      if (area && t.listName !== area) return false;
      if (scope === "mine" && !(t.everyone || (myEmail && t.assignees.some((a) => a.email === myEmail)))) return false;
      if (ql && !t.name.toLowerCase().includes(ql)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, q, clientSet, area, showClosed, scope, tscope, overrides]);

  // Agrupación implícita: 1 cliente → por Área; varios/ninguno → por Cliente.
  const groupByArea = clientSet.size === 1;
  const sections = useMemo(() => {
    const map = new Map();
    for (const t of filtered) {
      const key = groupByArea ? (t.listName || "—") : (t.project || "—");
      const label = groupByArea ? (t.listName || "Sin área") : (t.project || "Sin cliente");
      if (!map.has(key)) map.set(key, { key, label, campaign: !groupByArea && campaignSet.has(t.project), items: [] });
      map.get(key).items.push(t);
    }
    const arr = [...map.values()];
    arr.forEach((s) => s.items.sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity)));
    // Campañas al final cuando agrupamos por cliente; alfabético dentro.
    return arr.sort((a, b) => (a.campaign - b.campaign) || a.label.localeCompare(b.label));
  }, [filtered, groupByArea, campaignSet]);

  // Tarea abierta en el panel derecho (persiste aunque cambien los filtros).
  // Busca también dentro de las subtareas anidadas.
  const selected = useMemo(() => findTaskById(tasks, selectedId), [tasks, selectedId]);

  const activeFilters = clientSet.size + (area ? 1 : 0) + (scope === "mine" ? 1 : 0) + (showClosed ? 1 : 0) + (tscope !== "todo" ? 1 : 0) + (q ? 1 : 0);

  const setOverride = (id, val) => setOverrides((m) => { const n = new Map(m); val ? n.set(id, val) : n.delete(id); return n; });

  // Escribe el estado en ClickUp (con revertir si falla).
  const commitStatus = (id, st, prev) => start(async () => {
    const res = await setClickUpTaskStatus(id, st.status);
    if (!res?.ok) setOverride(id, prev);
  });

  const pickStatus = (id, st) => {
    const prev = overrides.get(id);
    setOverride(id, { status: st.status, statusType: st.type, statusColor: st.color });
    // Completar (estado cerrado) → toast con 5s para deshacer; el resto, directo.
    if (st.type === "closed" || st.type === "done") {
      clearTimeout(undoRef.current);
      setUndo({ id, st, prev });
      undoRef.current = setTimeout(() => { setUndo(null); commitStatus(id, st, prev); }, 5000);
    } else {
      commitStatus(id, st, prev);
    }
  };
  const undoComplete = () => {
    clearTimeout(undoRef.current);
    setUndo((u) => { if (u) setOverride(u.id, u.prev); return null; });
  };

  // Fila + subtareas anidadas (desplegable estilo ClickUp) para la vista Lista.
  const renderRow = (t, depth = 0) => {
    const subs = t.subtasks ?? [];
    const isExp = expanded.has(t.id);
    return (
      <div key={t.id}>
        <TaskRow
          t={t}
          eff={eff(t)}
          open={isOpen(t)}
          statuses={statusesByList[t.listId] || []}
          onPickStatus={pickStatus}
          onOpen={openTask}
          active={t.id === selectedId}
          depth={depth}
          hasSubtasks={subs.length > 0}
          expanded={isExp}
          onToggle={() => toggleExpand(t.id)}
        />
        {isExp && subs.map((s) => renderRow(s, depth + 1))}
      </div>
    );
  };

  if (!tasks.length) {
    return (
      <>
        <ScreenHeader kicker="ClickUp" title="Tareas" />
        <Surface>
          <EmptyState>
            {visibleCount === 0
              ? "No hay listas activas todavía. Ve a Administrar › ClickUp y activa las listas que quieras ver aquí."
              : "No hay tareas en las listas activas."}
          </EmptyState>
        </Surface>
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        kicker="ClickUp"
        title={clientSet.size === 1 ? [...clientSet][0] : "Tareas"}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-micro text-mutedSoft tabular-nums hidden sm:inline">{filtered.length}</span>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              title="Recargar desde ClickUp"
              aria-label="Recargar"
              className="h-8 w-8 grid place-items-center rounded-lg text-mutedSoft hover:text-ink hover:bg-surface2/60 transition disabled:opacity-50"
            >
              <svg className={cn("h-4 w-4", refreshing && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
            </button>
            <Tabs value={view} onChange={setView} tabs={[{ value: "lista", label: "Lista" }, { value: "calendario", label: "Calendario" }]} />
          </div>
        }
      />

      {/* Clientes (izq, apilados) + filtros (der) — en una sola línea */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-none -mx-1 px-1 py-1">
          {(() => {
            const fixed = clients.filter((c) => !c.campaign);
            const camps = clients.filter((c) => c.campaign);
            const Avatar = (c, i, fanClass) => {
              const sel = clientSet.has(c.name);
              const dim = clientSet.size > 0 && !sel;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleClient(c.name)}
                  onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHoverCtx({ name: c.name, count: c.count, x: r.left + r.width / 2, y: r.top }); }}
                  onMouseLeave={() => setHoverCtx(null)}
                  className={cn("relative shrink-0 transition-all duration-200 hover:z-20 active:scale-95", i > 0 && fanClass, dim ? "opacity-30 hover:opacity-90" : "opacity-100")}
                >
                  <ClientAvatar name={c.name} active={sel} campaign={c.campaign} icon={clientIcon(c.name, iconsByClient[c.name])} colorKey={colorsByClient[c.name]} />
                </button>
              );
            };
            return (
              <>
                <div className="group/gfix flex items-center shrink-0">
                  {fixed.map((c, i) => Avatar(c, i, "-ml-2.5 group-hover/gfix:ml-1"))}
                </div>
                {camps.length > 0 && <span className="w-px h-6 bg-border shrink-0 mx-2.5" title="Campañas / lanzamientos" />}
                {camps.length > 0 && (
                  <div className="group/gcamp flex items-center shrink-0">
                    {camps.map((c, i) => Avatar(c, i, "-ml-2.5 group-hover/gcamp:ml-1"))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SearchField value={q} onChange={setQ} />
          <button
            type="button"
            onClick={cycleTscope}
            title="Cambiar horizonte de fecha"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-surface hover:border-borderStrong transition text-[13px] shrink-0"
          >
            <svg className="h-4 w-4 text-mutedSoft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
            <span className="text-ink whitespace-nowrap">{SCOPES.find((s) => s.key === tscope)?.label}</span>
            <span className="text-mutedSoft tabular-nums">{filtered.length}</span>
          </button>
          {/* Modo Yo — toggle estilo ClickUp: filtra a tus tareas. */}
          <button
            type="button"
            onClick={() => setScope((s) => (s === "mine" ? "all" : "mine"))}
            title="Ver solo mis tareas"
            aria-pressed={scope === "mine"}
            className={cn(
              "inline-flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border transition text-[13px] shrink-0",
              scope === "mine"
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border bg-surface text-ink hover:border-borderStrong"
            )}
          >
            {myPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={myPhoto} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="h-7 w-7 rounded-full grid place-items-center text-[11px] text-bg bg-mutedSoft">
                {(myEmail || "?")[0]?.toUpperCase()}
              </span>
            )}
            Mis tareas
          </button>
          <Switch checked={showClosed} onChange={setShowClosed} label="Cerradas" />
          {/* Filtro de Área oculto por ahora
          {areas.length > 1 && (
            <Select
              value={area || "all"}
              onChange={(v) => setArea(v === "all" ? "" : v)}
              className="shrink-0 min-w-[150px]"
              options={[{ value: "all", label: "Todas las áreas" }, ...areas.map((d) => ({ value: d, label: d }))]}
            />
          )} */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setClientSet(new Set()); setArea(""); setScope("all"); setShowClosed(false); setTscope("todo"); setQ(""); }}
              className="shrink-0 text-micro text-muted hover:text-ink transition whitespace-nowrap"
            >
              Limpiar ({activeFilters})
            </button>
          )}
        </div>
      </div>

      <div className={cn(selected && "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4 lg:items-start")}>
        <div className="min-w-0">
      {/* LISTA — cada grupo (cliente/área) en su propia caja */}
      {view === "lista" && (
        filtered.length === 0 ? (
          <Surface pad="sm"><EmptyState className="my-2">Nada con esos filtros.</EmptyState></Surface>
        ) : (
          <div className="space-y-3">
            {sections.map((sec) => (
              <Surface key={sec.key} pad="sm">
                <Section label={sec.label} count={sec.items.length} campaign={sec.campaign}>
                  {sec.items.map((t) => renderRow(t))}
                </Section>
              </Surface>
            ))}
          </div>
        )
      )}

      {/* CALENDARIO — mes con las tareas en su fecha */}
      {view === "calendario" && <CalendarView tasks={filtered} colorsByClient={colorsByClient} onOpen={openTask} />}
        </div>

        {selected && (
          <TaskDetail
            t={selected}
            eff={eff(selected)}
            open={isOpen(selected)}
            statuses={statusesByList[selected.listId] || []}
            onPickStatus={pickStatus}
            onOpen={openTask}
            selectedId={selectedId}
            isAdmin={isAdmin}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* Toast "Tarea completada" con barra de 5s y deshacer */}
      {undo && typeof document !== "undefined" && createPortal(
        <div className="fixed top-4 left-1/2 z-[100]" style={{ animation: "toastIn 0.2s ease both" }}>
          <div className="relative overflow-hidden rounded-xl bg-ink text-bg shadow-float pl-4 pr-2 py-2.5 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-small">
              <span className="h-4 w-4 rounded-full bg-success grid place-items-center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-bg"><polyline points="20 6 9 17 4 12" /></svg></span>
              Tarea completada
            </span>
            <button onClick={undoComplete} className="text-small font-medium px-2 py-1 rounded-lg hover:bg-bg/15 transition">Deshacer</button>
            <span
              key={undo.id}
              className="absolute left-0 bottom-0 h-[3px] w-full bg-bg/50 origin-left"
              style={{ animation: "toastbar 5s linear forwards" }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Tooltip de los avatares — portal para que no lo recorte el scroll */}
      {hoverCtx && typeof document !== "undefined" && createPortal(
        <div className="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-full" style={{ left: hoverCtx.x, top: hoverCtx.y - 8 }}>
          <div className="relative whitespace-nowrap rounded-lg bg-ink text-bg text-[12px] px-2.5 py-1 shadow-float">
            {hoverCtx.name}
            {hoverCtx.count > 0 && <span className="ml-1.5 text-bg/55 tabular-nums">{hoverCtx.count}</span>}
            <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-ink" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
