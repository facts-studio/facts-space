"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tabs, Badge, Select, Switch, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { paletteColor } from "@/lib/client-palette";

const DAY = 86400000;
const startOfDay = (ts) => new Date(ts).setHours(0, 0, 0, 0);
const addDays = (ts, n) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.setHours(0, 0, 0, 0); };
const isWeekend = (ts) => [0, 6].includes(new Date(ts).getDay());
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const dm = (ts) => `${new Date(ts).getDate()} ${MESES[new Date(ts).getMonth()]}`;

// Ancho de un día en píxeles por nivel de zoom. Es lo único que cambia entre
// vistas: el resto del dibujo se deriva de aquí.
const ZOOM = {
  dia: { px: 34, label: "Días" },
  semana: { px: 13, label: "Semanas" },
  mes: { px: 5, label: "Meses" },
};

const cerrada = (t) => ["done", "closed"].includes(t.statusType);

// Aspecto de la barra según el estado, sobre el color del proyecto:
//  · pendiente → contorno, sin relleno (aún no ha empezado)
//  · en curso  → relleno suave con rayas, como las barras de progreso del portal
//  · hecha     → relleno pleno y apagado
function barStyle(t, col) {
  if (cerrada(t)) {
    return { background: col.bg, borderColor: "transparent", opacity: 0.55 };
  }
  if (t.statusType === "custom") {
    return {
      backgroundColor: col.bg,
      backgroundImage: `repeating-linear-gradient(45deg, ${col.fg}22 0 4px, transparent 4px 10px)`,
      borderColor: `${col.fg}33`,
    };
  }
  return { background: "transparent", borderColor: `${col.fg}55` };
}

// Rango a dibujar: el del sprint (ampliado si alguna tarea se sale) más margen
// generoso a los lados y cuadrado a meses completos. La línea de tiempo no debe
// morir en la última tarea: se sigue pudiendo mirar meses por delante y por
// detrás, que es de lo que va un cronograma.
const MESES_ANTES = 1;
const MESES_DESPUES = 4;
const primerDiaDelMes = (ts, salto = 0) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + salto, 1).setHours(0, 0, 0, 0);
};

function rangeOf(sprint, tasks) {
  const fechas = [sprint.start, sprint.due];
  for (const t of tasks) { if (t.startDate) fechas.push(t.startDate); if (t.dueDate) fechas.push(t.dueDate); }
  const validas = fechas.filter(Boolean).map(startOfDay);
  // Sin ninguna fecha, el cronograma se ancla en el mes actual.
  const min = validas.length ? Math.min(...validas) : startOfDay(new Date().getTime());
  const max = validas.length ? Math.max(...validas) : min;
  const from = primerDiaDelMes(min, -MESES_ANTES);
  const to = addDays(primerDiaDelMes(max, MESES_DESPUES + 1), -1); // último día del mes
  const days = Math.round((to - from) / DAY) + 1;
  return { from, to, days };
}

export default function SprintGantt({ sprint, tasks = [], back = null }) {
  const [zoom, setZoom] = useState("dia");
  const [showClosed, setShowClosed] = useState(false);
  const [person, setPerson] = useState("");
  const scroller = useRef(null);
  // Tooltip propio: el `title` del navegador es lento, feo y no se puede diseñar.
  const [tip, setTip] = useState(null); // { task, x, y }
  // Ancho de la columna de tareas. Se arrastra desde la línea que la separa del
  // calendario, como en cualquier tabla con columnas redimensionables.
  const [colW, setColW] = useState(260);
  const dragCol = (ev) => {
    ev.preventDefault();
    const x0 = ev.clientX;
    const w0 = colW;
    const move = (e) => setColW(Math.min(560, Math.max(150, w0 + e.clientX - x0)));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const hoy = useMemo(() => startOfDay(new Date().getTime()), []);

  const people = useMemo(() => {
    const m = new Map();
    for (const t of tasks) for (const a of t.assignees ?? []) if (a.name) m.set(a.name, a);
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [tasks]);

  const visibles = useMemo(() => {
    const list = tasks.filter((t) => (showClosed || !cerrada(t)) && (!person || (t.assignees ?? []).some((a) => a.name === person)));
    // Por fecha de inicio: un cronograma se lee en diagonal, de arriba a abajo.
    return list.sort((a, b) => (a.startDate ?? a.dueDate ?? Infinity) - (b.startDate ?? b.dueDate ?? Infinity));
  }, [tasks, showClosed, person]);

  const range = useMemo(() => rangeOf(sprint, visibles), [sprint, visibles]);
  const px = ZOOM[zoom].px;
  const width = range ? range.days * px : 0;
  const x = (ts) => ((startOfDay(ts) - range.from) / DAY) * px;

  // Al abrir, deja "hoy" a la vista en lugar del principio del rango.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !range) return;
    const left = x(hoy) - el.clientWidth / 3;
    el.scrollLeft = Math.max(0, left);
    // solo al montar y al cambiar el zoom
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, range?.from]);

  const dias = useMemo(() => (range ? Array.from({ length: range.days }, (_, i) => addDays(range.from, i)) : []), [range]);
  // Cabecera de meses: una etiqueta por mes con su ancho real.
  const meses = useMemo(() => {
    const out = [];
    for (const d of dias) {
      const key = `${new Date(d).getFullYear()}-${new Date(d).getMonth()}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.days++;
      else out.push({ key, ts: d, days: 1 });
    }
    return out;
  }, [dias]);

  const hechas = tasks.filter(cerrada).length;
  const col = paletteColor(sprint.client || sprint.name, sprint.colorKey);

  return (
    // Alto de la ventana menos el aire del layout: el scroll vive dentro.
    <div className="flex flex-col h-[calc(100vh-5rem)] -mt-2 md:-mt-8">
      <header className="shrink-0 border-b border-border/60 px-5 md:px-10 pb-4">
        {/* Identidad: de dónde vienes, qué estás mirando y cómo va */}
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            {back}
            <h1 className="font-display text-[22px] md:text-[26px] leading-tight text-ink truncate mt-2">
              {sprint.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {sprint.client && (
                <span
                  className="inline-flex items-center h-5 px-2 rounded-full text-[11.5px] font-medium"
                  style={{ background: col.bg, color: col.fg }}
                >
                  {sprint.client}
                </span>
              )}
              {sprint.start && sprint.due && (
                <span className="text-micro text-mutedSoft">{dm(sprint.start)} – {dm(sprint.due)}</span>
              )}
            </div>
          </div>

          {/* Progreso, alineado a la derecha: es el titular del sprint */}
          {tasks.length > 0 && (
            <div className="w-[180px] shrink-0">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-micro text-mutedSoft">Progreso</span>
                <span className="text-small text-ink tabular-nums">
                  {Math.round((hechas / tasks.length) * 100)}%
                </span>
              </div>
              <ProgressBar value={hechas} max={tasks.length} />
              <p className="text-micro text-mutedSoft mt-1.5 tabular-nums">{hechas} de {tasks.length} hechas</p>
            </div>
          )}
        </div>

        {/* Controles: escala a la izquierda, filtros a la derecha */}
        <div className="flex items-center justify-between gap-4 flex-wrap mt-5">
          <div className="flex items-center gap-2">
            <Tabs
              value={zoom}
              onChange={setZoom}
              tabs={Object.entries(ZOOM).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <button
              type="button"
              onClick={() => { const el = scroller.current; if (el && range) el.scrollTo({ left: Math.max(0, x(hoy) - el.clientWidth / 3), behavior: "smooth" }); }}
              className="h-8 px-3 rounded-lg text-[12.5px] text-muted hover:text-ink hover:bg-surface2/70 transition"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center gap-4">
            {people.length > 0 && (
              <Select
                value={person}
                onChange={setPerson}
                className="h-8"
                ariaLabel="Filtrar por persona"
                options={[{ value: "", label: "Todo el equipo" }, ...people.map((p) => ({ value: p.name, label: p.name }))]}
              />
            )}
            <Switch checked={showClosed} onChange={setShowClosed} label="Cerradas" />
            <span className="hidden sm:block h-4 w-px bg-border/70" aria-hidden />
            <Badge kind="neutral">{visibles.length} tareas</Badge>
          </div>
        </div>
      </header>

      {!range || visibles.length === 0 ? (
        <div className="flex-1 grid place-items-center px-5 md:px-10">
          <p className="text-small text-mutedSoft text-center">
            {tasks.length === 0 ? "Este sprint aún no tiene tareas." : "Ninguna tarea con estos filtros."}
          </p>
        </div>
      ) : (
        <div ref={scroller} className="flex-1 overflow-auto">
          <div className="w-max min-w-full">
            {/* Cabecera del calendario, pegada arriba al hacer scroll vertical */}
            <div className="sticky top-0 z-20 flex bg-bg border-b border-border/60">
              <div className="sticky left-0 z-30 shrink-0 bg-bg border-r border-border/60" style={{ width: colW }} />
              <div className="flex-1" style={{ minWidth: width }}>
                <div className="flex h-6">
                  {meses.map((m, i) => {
                    const d = new Date(m.ts);
                    // El año solo cuando cambia (o en enero): repetirlo en cada
                    // mes come sitio y no dice nada nuevo.
                    const nuevoAño = i === 0 || d.getFullYear() !== new Date(meses[i - 1].ts).getFullYear();
                    return (
                      <div key={m.key} style={{ width: m.days * px }} className="text-[11px] text-muted px-2 truncate border-r border-border/40 leading-6 capitalize">
                        {d.toLocaleDateString("es-ES", { month: "long" })}
                        {nuevoAño && <span className="text-mutedSoft"> {d.getFullYear()}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex h-6">
                  {dias.map((d) => (
                    <div
                      key={d}
                      style={{ width: px }}
                      className={cn(
                        "shrink-0 text-[10px] leading-6 text-center tabular-nums",
                        isWeekend(d) ? "text-mutedSoft/50 bg-surface2/40" : "text-mutedSoft",
                        d === hoy && "text-danger font-medium"
                      )}
                    >
                      {zoom === "dia" ? new Date(d).getDate() : new Date(d).getDay() === 1 ? new Date(d).getDate() : ""}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filas */}
            <div className="relative">
              {visibles.map((t) => {
                const fin = t.dueDate ?? null;
                const ini = t.startDate && t.startDate < (fin ?? Infinity) ? t.startDate : fin;
                const vencida = fin && startOfDay(fin) < hoy && !cerrada(t);
                return (
                  <div key={t.id} className="flex border-b border-border/30 hover:bg-surface2/30 transition-colors">
                    {/* Columna fija de tareas */}
                    <div className="sticky left-0 z-10 shrink-0 bg-bg border-r border-border/60 pl-5 md:pl-10 pr-4 py-2.5 flex items-center gap-2.5 group/col" style={{ width: colW }}>
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: cerrada(t) ? `${col.fg}66` : t.statusType === "custom" ? col.fg : "transparent", boxShadow: cerrada(t) || t.statusType === "custom" ? "none" : `inset 0 0 0 1px ${col.fg}66` }}
                      />
                      <a
                        href={t.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        title={t.name}
                        className={cn("min-w-0 flex-1 text-small truncate hover:underline", cerrada(t) ? "text-mutedSoft" : "text-inkSoft")}
                      >
                        {t.name}
                      </a>
                      {(t.assignees ?? []).slice(0, 1).map((a) => (
                        <span key={a.name} title={a.name} className="shrink-0 text-micro text-mutedSoft">{a.initials ?? a.name?.[0]}</span>
                      ))}
                      <span
                        onPointerDown={dragCol}
                        title="Arrastra para ensanchar la columna"
                        className="absolute right-0 inset-y-0 w-2 translate-x-1/2 cursor-col-resize z-20 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-borderStrong after:transition-colors"
                      />
                    </div>

                    {/* Carril */}
                    <div className="relative flex-1" style={{ minWidth: width }}>
                      {/* Fondo de fines de semana, para leer las semanas */}
                      <div className="absolute inset-0 flex" aria-hidden>
                        {dias.map((d) => (
                          <div key={d} style={{ width: px }} className={cn("shrink-0", isWeekend(d) && "bg-surface2/40")} />
                        ))}
                      </div>
                      {fin ? (() => {
                        // Mínimo 64px: por debajo, dentro de la barra no cabe ni una sílaba.
                        const w = Math.max(x(fin) - x(ini) + px, 64);
                        return (
                          <a
                            href={t.url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            onMouseEnter={(ev) => {
                              const r = ev.currentTarget.getBoundingClientRect();
                              setTip({ task: t, ini, fin, x: r.left + r.width / 2, y: r.top });
                            }}
                            onMouseLeave={() => setTip(null)}
                            className={cn(
                              "group/task absolute top-1/2 -translate-y-1/2 h-5 rounded-md border flex items-center px-1.5 overflow-hidden transition hover:brightness-[0.97]",
                              vencida && "ring-1 ring-danger/70"
                            )}
                            style={{ left: x(ini), width: w, ...barStyle(t, col) }}
                          >
                            <span className="marquee text-[10.5px] leading-none w-full" style={{ color: col.fg }}>
                              <span>{t.name}</span>
                            </span>
                          </a>
                        );
                      })() : null}
                      {!fin && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-micro text-mutedSoft/70">sin fecha</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Hoy, por encima de todas las filas */}
              {hoy >= range.from && hoy <= range.to && (
                <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 w-px bg-danger/50" style={{ left: colW + x(hoy) + px / 2 }} />
              )}
            </div>
          </div>
        </div>
      )}

      {tip && typeof document !== "undefined" && createPortal(
        <div
          className="pointer-events-none fixed z-[120] -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y - 10 }}
        >
          <div className="max-w-[320px] rounded-xl bg-paper border border-border/70 shadow-float px-3.5 py-2.5">
            <p className="text-small text-ink leading-snug">{tip.task.name}</p>
            <p className="text-micro text-mutedSoft mt-1">
              {[
                tip.ini === tip.fin ? dm(tip.fin) : `${dm(tip.ini)} – ${dm(tip.fin)}`,
                tip.task.status,
                (tip.task.assignees ?? []).map((a) => a.name).filter(Boolean).join(", ") || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {/* Pico, para que se vea de qué barra cuelga */}
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-paper border-r border-b border-border/70" />
        </div>,
        document.body
      )}
    </div>
  );
}
