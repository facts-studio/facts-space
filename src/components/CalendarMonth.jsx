"use client";

import { useMemo, useState, useTransition } from "react";
import { EVENT_TYPES, TEAM } from "@/lib/mock";
import { workingDaysBetween } from "@/lib/dates";
import { requestVacation } from "@/lib/actions/vacations";
import { evaluateVacation } from "@/lib/vacation-policy";
import { ABSENCE_OPTIONS } from "@/lib/absences";
import { Switch } from "@/components/ui";
import { cn } from "@/lib/cn";

// Colores del veredicto orientativo de política.
const POLICY_BANNER = { ok: "bg-successSoft/50 text-success", warn: "bg-warnSoft/45 text-warn", bad: "bg-dangerSoft/45 text-danger" };
const POLICY_TONE = { ok: "text-success", warn: "text-warn", bad: "text-danger" };
const POLICY_GLYPH = { ok: "✓", warn: "!", bad: "✕" };

const MEMBER = new Map(TEAM.map((m) => [m.name, m]));
// Tipos con persona asociada → mostramos miniatura.
const WITH_PERSON = new Set(["cumple", "vacaciones", "ausencia"]);
// Con la vista de tareas activa, el resto de eventos se apaga a gris para que el
// color quede en los clientes. Estos NO: los hitos marcan fechas clave y deben
// leerse igual con tareas encendidas o apagadas.
const KEEP_COLOR = new Set(["tarea", "hito"]);

// Tipos en los que la duración aporta (un festivo o un cumple duran 1 día y
// decirlo es ruido).
const WITH_SPAN = new Set(["vacaciones", "ausencia"]);

// "1 día" · "20–24 jul" · "28 jun – 3 jul"
const dayMonth = (isoStr) =>
  new Date(isoStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
function spanLabel(e) {
  if (!e.end || e.end === e.start) return "1 día";
  const a = new Date(e.start + "T00:00:00");
  const b = new Date(e.end + "T00:00:00");
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${dayMonth(e.end)}`
    : `${dayMonth(e.start)} – ${dayMonth(e.end)}`;
}

// Banderita de hito: toma el color del chip (currentColor).
const FlagIcon = () => (
  <svg className="h-[10px] w-[10px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 21V4M5 4h11l-2 3.5L16 11H5" />
  </svg>
);

function MiniAvatar({ member, ring = "ring-white/70" }) {
  if (!member) return null;
  if (member.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={member.photo} alt={member.name} className={`w-4 h-4 rounded-full object-cover shrink-0 ring-1 ${ring}`} />;
  }
  return (
    <span className="w-4 h-4 rounded-full bg-white/85 text-ink grid place-items-center text-[8px] font-semibold shrink-0">
      {member.name[0]}
    </span>
  );
}

const WD = ["L", "M", "X", "J", "V", "S", "D"]; // lunes primero
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MAX_LANES = 3; // barras visibles por día antes de "+N"
const EMPTY = [];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DAY_MS = 86400000;

// Barras continuas de una semana: cada evento se recorta a los límites de la
// semana y se le asigna un carril (lane) para que no se solapen. Un rango de
// varios días es UNA sola barra que abarca las columnas correspondientes.
function weekBars(weekDates, events) {
  const wStart = weekDates[0];
  const wEnd = weekDates[6];
  const bars = [];
  for (const e of events) {
    const s = new Date(e.start + "T00:00:00");
    const en = new Date(e.end + "T00:00:00");
    if (en < wStart || s > wEnd) continue;
    const cs = Math.max(0, Math.round((s - wStart) / DAY_MS));
    const ce = Math.min(6, Math.round((en - wStart) / DAY_MS));
    bars.push({ e, cs, ce, span: ce - cs + 1, continuesLeft: s < wStart, continuesRight: en > wEnd });
  }
  bars.sort((a, b) => a.cs - b.cs || b.span - a.span);
  const laneEnds = [];
  for (const b of bars) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] >= b.cs) lane++;
    b.lane = lane;
    laneEnds[lane] = b.ce;
  }
  return bars;
}

// Rejilla de 42 días (6 semanas, lunes primero) de un mes dado.
function monthDays(y, m) {
  const off = (new Date(y, m, 1).getDay() + 6) % 7;
  const start = new Date(y, m, 1 - off);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
}

// Acabado del chip por tipo de evento (clases explícitas para Tailwind).
const CHIP = {
  hito: "bg-dangerSoft text-danger",
  cumple: "bg-infoSoft text-info",
  vacaciones: "bg-warnSoft text-warn",
  ausencia: "bg-violetSoft text-violet",
  festivo: "bg-successSoft text-success",
  tarea: "bg-surface2 text-inkSoft",
};

// Emoji por tipo (para el icono del detalle del día cuando no hay foto de persona).
const ICON = { hito: "🔥", cumple: "🎂", vacaciones: "🏖️", ausencia: "🌴", festivo: "🗓️", tarea: "📋" };
// Tipo "tarea" añadido a los tipos de evento (para las búsquedas de color/label).
const TYPE = { ...EVENT_TYPES, tarea: { label: "Tarea", color: "brand" } };
// Relleno suave por color para la vista anual.
const YFILL = {
  brand: "bg-brandSoft", info: "bg-infoSoft", warn: "bg-warnSoft", violet: "bg-violetSoft", success: "bg-successSoft", danger: "bg-dangerSoft",
};
// Prioridad de color cuando un día tiene varios eventos.
const YORDER = ["hito", "festivo", "cumple", "vacaciones", "ausencia"];
// Tile del panel del día: fondo suave + borde + acento por tipo.
const TILE = {
  brand: "bg-brandSoft/60 border-brand/15",
  info: "bg-infoSoft/55 border-info/15",
  warn: "bg-warnSoft/45 border-warn/15",
  violet: "bg-violetSoft/55 border-violet/15",
  success: "bg-successSoft/55 border-success/15",
  danger: "bg-dangerSoft/45 border-danger/15",
};
const TEXT = {
  brand: "text-brand", info: "text-info", warn: "text-warn", violet: "text-violet", success: "text-success", danger: "text-danger",
};
// Acabado del chip de filtro activo por color (clases explícitas).
const FILTER_ON = {
  brand: "bg-brandSoft text-brand border-brand/30",
  info: "bg-infoSoft text-info border-info/30",
  warn: "bg-warnSoft text-warn border-warn/30",
  violet: "bg-violetSoft text-violet border-violet/30",
  success: "bg-successSoft text-success border-success/30",
  danger: "bg-dangerSoft text-danger border-danger/30",
};

export default function CalendarMonth({ events = [], tasks = [], canRequest = false }) {
  const [showTasks, setShowTasks] = useState(false);
  const allEvents = useMemo(() => (showTasks ? events.concat(tasks) : events), [events, tasks, showTasks]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayISO = iso(today);
  // Arranca en el mes del próximo evento (o el mes actual si no hay).
  const [cursor, setCursor] = useState(() => {
    const next = events
      .map((e) => new Date(e.start + "T00:00:00"))
      .filter((d) => d >= today)
      .sort((a, b) => a - b)[0];
    const base = next || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("mes"); // "mes" | "año"
  // Filtro por tipo de evento. Todos activos por defecto.
  const [active, setActive] = useState(() => new Set(Object.keys(EVENT_TYPES)));
  // Clic en un filtro: aísla a ese tipo. Si ya está solo ese (o clicas el único),
  // vuelve a mostrar todos. Puedes sumar/quitar tipos clicando otros.
  const toggle = (k) =>
    setActive((cur) => {
      const all = Object.keys(EVENT_TYPES);
      if (cur.size === all.length) return new Set([k]);      // de "todos" → solo ese
      if (cur.size === 1 && cur.has(k)) return new Set(all);  // el único → todos
      const n = new Set(cur);
      n.has(k) ? n.delete(k) : n.add(k);
      return n.size ? n : new Set(all);                       // nunca vacío
    });

  // Filtro por persona. null = sin filtro (todas). Set = solo esas personas
  // (los eventos sin persona —festivos— se siguen mostrando).
  const [people, setPeople] = useState(null);
  const togglePerson = (name) =>
    setPeople((cur) => {
      const n = new Set(cur || []);
      n.has(name) ? n.delete(name) : n.add(name);
      return n.size === 0 ? null : n;
    });
  const passPerson = (e) => !people || !e.who || people.has(e.who);
  const passType = (e) => e.type === "tarea" || active.has(e.type); // tareas van por su propio switch
  const pass = (e) => passType(e) && passPerson(e);

  // Eventos (+ tareas si el switch está on) por día, sensible al rango start→end.
  const byDay = useMemo(() => {
    const m = new Map();
    for (const e of allEvents) {
      const d = new Date(e.start + "T00:00:00");
      const end = new Date(e.end + "T00:00:00");
      let guard = 0;
      while (d <= end && guard < 370) {
        const k = iso(d);
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(e);
        d.setDate(d.getDate() + 1); guard++;
      }
    }
    return m;
  }, [allEvents]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });

  const selItems = (selected ? byDay.get(selected) || EMPTY : EMPTY).filter(pass);

  // Eventos que se pintan como barras continuas (los festivos se muestran como
  // fondo del día, no como barra, para no duplicar).
  const barEvents = useMemo(
    () => allEvents.filter((e) => e.type !== "festivo" && pass(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, active, people],
  );
  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(days.slice(i, i + 7));

  // Festivos (ISO) para descontar del cómputo de días laborables en la solicitud.
  const festivoSet = useMemo(() => {
    const s = new Set();
    for (const e of events) {
      if (e.type !== "festivo") continue;
      const d = new Date(e.start + "T00:00:00");
      const end = new Date(e.end + "T00:00:00");
      let g = 0;
      while (d <= end && g < 370) { s.add(iso(d)); d.setDate(d.getDate() + 1); g++; }
    }
    return s;
  }, [events]);

  // ── Solicitud de vacaciones: el rango se elige clicando en el propio calendario.
  const [reqMode, setReqMode] = useState(false);
  const [reqStart, setReqStart] = useState(null);
  const [reqEnd, setReqEnd] = useState(null);
  const [reqNote, setReqNote] = useState("");
  const [reqType, setReqType] = useState("vacaciones");
  const [reqMsg, setReqMsg] = useState(null);
  const [pending, startTransition] = useTransition();

  const reqEndEff = reqEnd || reqStart;
  const reqWd = reqStart ? workingDaysBetween(reqStart, reqEndEff, festivoSet) : 0;
  const reqAssess = reqMode && reqStart && reqType === "vacaciones" ? evaluateVacation(reqStart, reqEndEff, events) : null;

  const startRequest = () => {
    setReqMode(true);
    setReqStart(selected);
    setReqEnd(null);
    setReqNote("");
    setReqType("vacaciones");
    setReqMsg(null);
  };
  const cancelRequest = () => {
    setReqMode(false);
    setReqStart(null);
    setReqEnd(null);
    setReqMsg(null);
  };
  const submitRequest = () => {
    setReqMsg(null);
    startTransition(async () => {
      const res = await requestVacation({ startDate: reqStart, endDate: reqEndEff, note: reqNote, type: reqType });
      if (res.ok) setReqMsg({ ok: true, text: `Solicitud enviada · ${res.workingDays} ${res.workingDays === 1 ? "día laborable" : "días laborables"}. Pendiente de aprobación.` });
      else setReqMsg({ ok: false, text: res.error });
    });
  };

  // Click en un día: en modo solicitud fija inicio/fin del rango; si no, abre el
  // panel del día.
  const onDayClick = (k) => {
    if (reqMode) {
      setReqMsg(null);
      if (!reqStart || k < reqStart || reqEnd) { setReqStart(k); setReqEnd(null); }
      else setReqEnd(k);
      return;
    }
    setSelected((cur) => (cur === k ? null : k));
  };

  return (
    <div className={`h-[calc(100vh-5rem)] ${selected ? "lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 lg:items-stretch" : ""}`}>
      <div className="flex flex-col min-h-0 h-full">
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-[24px] text-ink capitalize leading-none flex items-baseline gap-2">
            {view === "mes" ? (
              <>{MESES[month]}<span className="font-sans font-normal text-[14px] text-mutedSoft tabular-nums">{year}</span></>
            ) : (
              <span className="tabular-nums">{year}</span>
            )}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {/* Switch: mostrar tareas de ClickUp en el calendario */}
            <Switch checked={showTasks} onChange={setShowTasks} label="Tareas" className="mr-2" />
            {/* Conmutador Mes / Año */}
            <div className="flex items-center bg-surface2/60 rounded-lg p-0.5 mr-1">
              {["mes", "año"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 rounded-md text-[12.5px] capitalize transition ${
                    view === v ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-1.5 rounded-lg text-[12.5px] text-inkSoft hover:bg-surface2/60 transition mr-1">Hoy</button>
            <button onClick={() => setCursor(view === "mes" ? new Date(year, month - 1, 1) : new Date(year - 1, month, 1))} aria-label="Anterior" className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface2/60 active:scale-95 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => setCursor(view === "mes" ? new Date(year, month + 1, 1) : new Date(year + 1, month, 1))} aria-label="Siguiente" className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface2/60 active:scale-95 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        {/* Filtros: por tipo (izda) · por persona (dcha) */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(EVENT_TYPES).map(([key, t]) => {
              const on = active.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  aria-pressed={on}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] border transition active:scale-[0.97] ${
                    on ? FILTER_ON[t.color] : "bg-transparent text-mutedSoft border-borderStrong/50 hover:text-ink hover:border-borderStrong"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
            {active.size < Object.keys(EVENT_TYPES).length && (
              <button
                onClick={() => setActive(new Set(Object.keys(EVENT_TYPES)))}
                className="ml-1 text-[12px] text-muted hover:text-ink transition px-2 py-1"
              >
                Mostrar todo
              </button>
            )}
          </div>

          {/* Filtro por persona */}
          <div className="flex items-center gap-1.5">
            {people && (
              <button
                onClick={() => setPeople(null)}
                className="text-[12px] text-muted hover:text-ink transition px-1.5"
              >
                Todas
              </button>
            )}
            <div className="flex items-center -space-x-1.5">
              {TEAM.map((m) => {
                const on = !people || people.has(m.name);
                return (
                  <button
                    key={m.id}
                    onClick={() => togglePerson(m.name)}
                    title={m.name}
                    aria-pressed={on}
                    className={`rounded-full transition active:scale-95 hover:z-10 ${
                      on ? "ring-2 ring-bg" : "opacity-35 grayscale ring-2 ring-bg"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt={m.name} className="w-7 h-7 rounded-full object-cover block" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {view === "mes" && (
        <>
        {/* Cabecera de días */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WD.map((w, i) => (
            <div key={i} className="text-[10px] uppercase tracking-wide text-mutedSoft/70 text-center py-1">{w}</div>
          ))}
        </div>

        {/* Rejilla del mes: fondo de días + barras continuas por semana */}
        <div className="grid grid-rows-6 gap-1 flex-1 min-h-0">
          {weeks.map((week, wi) => {
            const bars = weekBars(week, barEvents);
            // Cobertura por columna de las barras visibles (lane < MAX_LANES).
            const cover = [0, 0, 0, 0, 0, 0, 0];
            for (const b of bars) if (b.lane < MAX_LANES) for (let c = b.cs; c <= b.ce; c++) cover[c]++;
            return (
              <div key={wi} className="relative grid grid-cols-7 gap-1 min-h-[92px]">
                {/* Fondo: celdas de día */}
                {week.map((d, di) => {
                  const k = iso(d);
                  const inMonth = d.getMonth() === month;
                  const isToday = k === todayISO;
                  const isSel = selected === k;
                  const items = (byDay.get(k) || EMPTY).filter(pass);
                  const hasFestivo = items.some((e) => e.type === "festivo");
                  const inReq = reqMode && reqStart && k >= reqStart && k <= reqEndEff;
                  const isReqEdge = reqMode && (k === reqStart || k === reqEndEff);
                  const overflow = items.filter((e) => e.type !== "festivo").length - cover[di];
                  return (
                    <div
                      key={di}
                      onClick={() => onDayClick(k)}
                      className={`rounded-xl border p-1.5 flex flex-col cursor-pointer transition ${
                        isReqEdge
                          ? "border-ink bg-ink/[0.10] ring-2 ring-ink/30"
                          : inReq
                            ? "border-ink/30 bg-ink/[0.05]"
                            : isSel
                              ? "border-ink/45 bg-surface2/40"
                              : hasFestivo
                                ? "border-success/20 bg-successSoft/45 hover:border-success/35"
                                : "border-borderStrong/45 hover:border-borderStrong/70"
                      } ${!inMonth ? "opacity-45" : ""}`}
                    >
                      <div className="flex items-center justify-between px-0.5">
                        <span className={`text-[12px] tabular-nums leading-none inline-flex items-center justify-center ${
                          isToday ? "h-5 w-5 rounded-full bg-ink text-bg font-bold" : inMonth ? "text-ink" : "text-mutedSoft"
                        }`}>{d.getDate()}</span>
                        {items.length > 0 && <span className="text-[9.5px] text-mutedSoft tabular-nums">{items.length}</span>}
                      </div>
                      {overflow > 0 && (
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); setSelected(k); }}
                          className="mt-auto text-left px-0.5 text-[10px] text-mutedSoft hover:text-ink transition"
                        >
                          +{overflow}
                        </button>
                      )}
                    </div>
                  );
                })}
                {/* Barras continuas por encima de las celdas */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-7 gap-1 pt-[26px] [grid-auto-rows:22px]">
                  {bars.filter((b) => b.lane < MAX_LANES).map((b, bi) => {
                    const e = b.e;
                    const person = WITH_PERSON.has(e.type) && e.who ? MEMBER.get(e.who) : null;
                    const withAvatar = person && !b.continuesLeft;
                    // Las tareas van con el color de su cliente (tinte inline);
                    // el resto de eventos, con el color de su tipo. Con la vista
                    // de tareas activa, lo que NO es tarea pasa a gris para que
                    // el color quede reservado a los clientes.
                    // Tarea → siempre con el color de su cliente. Hito → solo cuando la vista
                    // de tareas está activa (fuera de ella conserva su rojo de hito).
                    const tint = e.type === "tarea" ? e.tint : (showTasks && e.type === "hito" ? e.tint ?? null : null);
                    const muted = showTasks && !KEEP_COLOR.has(e.type);
                    // Solicitada sin aprobar → contorno discontinuo, sin relleno.
                    const pending = Boolean(e.pending);
                    return (
                      <button
                        key={bi}
                        type="button"
                        title={
                          tint && e.client ? `${e.title} · ${e.client}`
                            : pending ? `${e.title} · pendiente de aprobar`
                              : e.title
                        }
                        onClick={(ev) => { ev.stopPropagation(); setSelected(iso(week[b.cs])); }}
                        style={{
                          gridColumn: `${b.cs + 1} / span ${b.span}`,
                          gridRow: b.lane + 1,
                          ...(tint ? { background: tint.bg, color: tint.fg } : null),
                        }}
                        className={cn(
                          "pointer-events-auto mx-1 flex items-center gap-1 h-[20px] text-[11px] leading-none rounded-full",
                          withAvatar ? "pl-0.5 pr-2" : "px-2",
                          // Cada rama excluye a las otras: cn() no hace merge de
                          // Tailwind, así que no se pueden solapar clases de bg.
                          !tint && (
                            pending
                              ? cn("bg-transparent border border-dashed border-current", muted ? "text-mutedSoft" : TEXT[TYPE[e.type]?.color] || "text-mutedSoft")
                              : muted
                                ? "bg-surface2/70 text-mutedSoft"
                                : CHIP[e.type] || "bg-surface2 text-ink"
                          ),
                          b.continuesLeft && "rounded-l-none",
                          b.continuesRight && "rounded-r-none",
                        )}
                      >
                        {withAvatar && <MiniAvatar member={person} ring="ring-bg" />}
                        {/* Los hitos se marcan con banderita (el color solo no basta) */}
                        {e.type === "hito" && !b.continuesLeft && <FlagIcon />}
                        <span className="truncate">{e.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {view === "año" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 min-h-0 overflow-y-auto pr-1">
            {Array.from({ length: 12 }, (_, mi) => (
              <div key={mi} className="rounded-xl bg-surface/45 p-3">
                <button onClick={() => { setCursor(new Date(year, mi, 1)); setView("mes"); }} className="text-small font-medium text-ink capitalize mb-2 hover:text-brand transition">{MESES[mi]}</button>
                <div className="grid grid-cols-7 gap-px mb-1">
                  {WD.map((w, i) => <div key={i} className="text-[8px] text-mutedSoft/60 text-center">{w}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {monthDays(year, mi).map((d, i) => {
                    const k = iso(d);
                    const inM = d.getMonth() === mi;
                    const its = inM ? (byDay.get(k) || EMPTY).filter(pass) : EMPTY;
                    const isT = k === todayISO;
                    const dom = YORDER.map((t) => its.find((e) => e.type === t)).find(Boolean);
                    const color = dom ? TYPE[dom.type].color : null;
                    return (
                      <button
                        key={i}
                        onClick={() => { if (!inM) return; setCursor(new Date(year, mi, 1)); setSelected(k); setView("mes"); }}
                        className={`aspect-square rounded-md flex items-center justify-center text-[9.5px] leading-none transition ${
                          !inM ? "opacity-0 pointer-events-none"
                            : isT ? "bg-ink text-bg font-semibold"
                            : color ? `${YFILL[color]} text-ink`
                            : "text-ink hover:bg-surface2/70"
                        }`}
                      >
                        {inM ? d.getDate() : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel del día seleccionado */}
      {selected && (
        <aside className="mt-6 lg:mt-0 lg:h-full lg:overflow-y-auto rounded-2xl border border-border/60 bg-surface/40 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] uppercase tracking-[0.12em] text-mutedSoft capitalize">
              {reqMode ? "Nueva solicitud" : fmtSel(selected)}
            </span>
            <button onClick={() => (reqMode ? cancelRequest() : setSelected(null))} aria-label="Cerrar" className="h-6 w-6 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          {reqMode ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-surface2/50 p-3">
                <p className="text-micro text-ink font-medium mb-1.5">Elige el rango en el calendario</p>
                <p className="text-small text-ink capitalize leading-snug">
                  {reqStart ? fmtSel(reqStart) : "—"}
                  {reqStart && reqEndEff !== reqStart && <> <span className="text-mutedSoft lowercase">al</span> {fmtSel(reqEndEff)}</>}
                </p>
                <p className="text-micro text-mutedSoft mt-1">
                  {reqWd > 0 ? <>{reqWd} {reqWd === 1 ? "día laborable" : "días laborables"} · findes y festivos no cuentan</> : "Sin días laborables en el rango."}
                </p>
              </div>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value)}
                className="input !h-9 !py-1 w-full"
              >
                {ABSENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {reqAssess && (
                <div className="space-y-1.5">
                  <div className={`rounded-lg px-2.5 py-1.5 text-micro font-medium ${POLICY_BANNER[reqAssess.status]}`}>
                    {reqAssess.title}
                  </div>
                  <ul className="space-y-1">
                    {reqAssess.reasons.map((r, i) => (
                      <li key={i} className="flex gap-1.5 text-micro text-inkSoft leading-snug">
                        <span className={`shrink-0 ${POLICY_TONE[r.tone]}`}>{POLICY_GLYPH[r.tone]}</span>
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-micro text-mutedSoft leading-snug">Orientativo: puedes solicitarla igualmente, pero según la carga es posible que tu responsable no pueda aprobarla.</p>
                </div>
              )}
              <input className="input !h-9 !py-1" placeholder="Nota (opcional)" value={reqNote} onChange={(e) => setReqNote(e.target.value)} />
              {reqMsg && <p className={`text-micro ${reqMsg.ok ? "text-success" : "text-danger"}`}>{reqMsg.text}</p>}
              <div className="flex items-center gap-2">
                <button onClick={submitRequest} disabled={pending || reqWd <= 0 || (reqMsg && reqMsg.ok)} className="btn-primary h-9 flex-1 text-[13px] disabled:opacity-50">
                  {pending ? "Enviando…" : reqMsg?.ok ? "Enviada ✓" : "Enviar solicitud"}
                </button>
                <button onClick={cancelRequest} className="btn-ghost h-9 text-[13px]">{reqMsg?.ok ? "Cerrar" : "Cancelar"}</button>
              </div>
            </div>
          ) : (
            <>
              {selItems.length > 0 ? (
                <ul className="space-y-2">
                  {selItems.map((e, j) => {
                    const t = TYPE[e.type];
                    const person = WITH_PERSON.has(e.type) && e.who ? MEMBER.get(e.who) : null;
                    // Tarea → siempre con el color de su cliente. Hito → solo cuando la vista
                    // de tareas está activa (fuera de ella conserva su rojo de hito).
                    const tint = e.type === "tarea" ? e.tint : (showTasks && e.type === "hito" ? e.tint ?? null : null);
                    const muted = showTasks && !KEEP_COLOR.has(e.type);
                    const pending = Boolean(e.pending);
                    return (
                      <li
                        key={j}
                        className={cn(
                          "rounded-lg border p-2.5 flex items-center gap-3",
                          !tint && (
                            pending
                              ? "border-dashed border-borderStrong bg-transparent"
                              : muted
                                ? "bg-surface2/50 border-border/60"
                                : TILE[t.color]
                          )
                        )}
                        style={tint ? { background: tint.bg, borderColor: `${tint.fg}26` } : undefined}
                      >
                        {person?.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-paper" />
                        ) : (
                          <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-paper text-[16px]">
                            {ICON[e.type] || "•"}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-small text-ink font-medium leading-snug truncate">{e.title}</p>
                          <p
                            className={cn("text-micro font-medium", !tint && (muted ? "text-mutedSoft" : TEXT[t.color]))}
                            style={tint ? { color: tint.fg } : undefined}
                          >
                            {/* En ausencias el tipo y la persona ya van en el título
                                ("Vacaciones Carles"): aquí la duración. En tareas,
                                el cliente; en el resto, el tipo. */}
                            {WITH_SPAN.has(e.type) ? spanLabel(e) : tint ? (e.client || t.label) : t.label}
                            {pending ? <span className="text-mutedSoft font-normal"> · pendiente de aprobar</span> : null}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-2xl border border-borderStrong/40 px-4 py-10 text-center text-[13px] text-mutedSoft">
                  Nada este día
                </div>
              )}

              {canRequest && (
                <button
                  onClick={startRequest}
                  className="group w-full mt-4 h-10 rounded-xl bg-surface2/60 text-ink text-[13px] font-medium inline-flex items-center justify-center gap-2 hover:bg-surface2 active:scale-[0.99] transition-[background-color,transform] duration-150"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 transition-transform duration-150 group-hover:rotate-90">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Solicitar vacaciones
                </button>
              )}
            </>
          )}
        </aside>
      )}
    </div>
  );
}

function fmtSel(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}
