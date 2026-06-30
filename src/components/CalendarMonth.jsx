"use client";

import { useMemo, useState, useTransition } from "react";
import { EVENT_TYPES, TEAM } from "@/lib/mock";
import { workingDaysBetween } from "@/lib/dates";
import { requestVacation } from "@/lib/actions/vacations";
import { evaluateVacation } from "@/lib/vacation-policy";

// Colores del veredicto orientativo de política.
const POLICY_BANNER = { ok: "bg-successSoft/50 text-success", warn: "bg-warnSoft/45 text-warn", bad: "bg-dangerSoft/45 text-danger" };
const POLICY_TONE = { ok: "text-success", warn: "text-warn", bad: "text-danger" };
const POLICY_GLYPH = { ok: "✓", warn: "!", bad: "✕" };

const MEMBER = new Map(TEAM.map((m) => [m.name, m]));
// Tipos con persona asociada → mostramos miniatura.
const WITH_PERSON = new Set(["cumple", "vacaciones"]);

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
const MAX_CHIPS = 3;
const EMPTY = [];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
  hito: "bg-danger text-white",
  cumple: "bg-infoSoft text-info",
  vacaciones: "bg-warnSoft text-warn",
  festivo: "bg-successSoft text-success",
};
const DOT = {
  brand: "bg-brand", info: "bg-info", warn: "bg-warn", violet: "bg-violet", success: "bg-success", danger: "bg-danger",
};
// Relleno suave por color para la vista anual.
const YFILL = {
  brand: "bg-brandSoft", info: "bg-infoSoft", warn: "bg-warnSoft", violet: "bg-violetSoft", success: "bg-successSoft", danger: "bg-dangerSoft",
};
// Prioridad de color cuando un día tiene varios eventos.
const YORDER = ["hito", "festivo", "cumple", "vacaciones"];
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

export default function CalendarMonth({ events = [], canRequest = false }) {
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
  const toggle = (k) =>
    setActive((cur) => {
      const n = new Set(cur);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
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
  const passType = (e) => active.has(e.type);
  const pass = (e) => passType(e) && passPerson(e);

  // Eventos por día (sensible al rango start→end).
  const byDay = useMemo(() => {
    const m = new Map();
    for (const e of events) {
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
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });

  const selItems = (selected ? byDay.get(selected) || EMPTY : EMPTY).filter(pass);

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
  const [reqMsg, setReqMsg] = useState(null);
  const [pending, startTransition] = useTransition();

  const reqEndEff = reqEnd || reqStart;
  const reqWd = reqStart ? workingDaysBetween(reqStart, reqEndEff, festivoSet) : 0;
  const reqAssess = reqMode && reqStart ? evaluateVacation(reqStart, reqEndEff, events) : null;

  const startRequest = () => {
    setReqMode(true);
    setReqStart(selected);
    setReqEnd(null);
    setReqNote("");
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
      const res = await requestVacation({ startDate: reqStart, endDate: reqEndEff, note: reqNote });
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] border transition active:scale-[0.97] ${
                    on ? FILTER_ON[t.color] : "bg-transparent text-mutedSoft border-borderStrong/50 hover:text-ink hover:border-borderStrong"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${on ? DOT[t.color] : "bg-mutedSoft/50"}`} />
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

        {/* Rejilla del mes */}
        <div className="grid grid-cols-7 gap-1 auto-rows-fr flex-1 min-h-0">
          {days.map((d, i) => {
            const k = iso(d);
            const inMonth = d.getMonth() === month;
            const isToday = k === todayISO;
            const isSel = selected === k;
            const items = (byDay.get(k) || EMPTY).filter(pass);
            const extra = items.length - MAX_CHIPS;
            const hasFestivo = items.some((e) => e.type === "festivo");
            const inReq = reqMode && reqStart && k >= reqStart && k <= reqEndEff;
            const isReqEdge = reqMode && (k === reqStart || k === reqEndEff);
            return (
              <div
                key={i}
                onClick={() => onDayClick(k)}
                className={`h-full min-h-[84px] rounded-xl border p-1.5 flex flex-col gap-1 cursor-pointer transition ${
                  isReqEdge
                    ? "border-brand bg-brand/[0.12] ring-2 ring-brand/50"
                    : inReq
                      ? "border-brand/45 bg-brand/[0.07]"
                      : isToday
                        ? "border-brand/55 bg-brand/[0.045] ring-1 ring-brand/30"
                        : isSel
                          ? "border-ink/45 bg-surface2/40"
                          : hasFestivo
                            ? "border-success/20 bg-successSoft/45 hover:border-success/35"
                            : "border-borderStrong/45 hover:border-borderStrong/70"
                } ${!inMonth ? "opacity-45" : ""}`}
              >
                <div className="flex items-center justify-between px-0.5">
                  <span className={`text-[12px] tabular-nums leading-none inline-flex items-center justify-center ${
                    isToday ? "h-5 w-5 rounded-full bg-brand text-white font-bold" : inMonth ? "text-ink" : "text-mutedSoft"
                  }`}>{d.getDate()}</span>
                  {items.length > 0 && <span className="text-[9.5px] text-mutedSoft tabular-nums">{items.length}</span>}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {items.slice(0, MAX_CHIPS).map((e, j) => {
                    const person = WITH_PERSON.has(e.type) && e.who ? MEMBER.get(e.who) : null;
                    return (
                      <span
                        key={j}
                        title={e.title}
                        className={`w-full flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] leading-tight ${CHIP[e.type] || "bg-surface2 text-ink"}`}
                      >
                        {person && <MiniAvatar member={person} />}
                        <span className="truncate">{e.title}</span>
                      </span>
                    );
                  })}
                  {extra > 0 && (
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); setSelected(k); }}
                      className="w-full text-left px-1.5 text-[10.5px] text-mutedSoft hover:text-ink transition"
                    >
                      +{extra} más
                    </button>
                  )}
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
                    const color = dom ? EVENT_TYPES[dom.type].color : null;
                    return (
                      <button
                        key={i}
                        onClick={() => { if (!inM) return; setCursor(new Date(year, mi, 1)); setSelected(k); setView("mes"); }}
                        className={`aspect-square rounded-md flex items-center justify-center text-[9.5px] leading-none transition ${
                          !inM ? "opacity-0 pointer-events-none"
                            : isT ? "bg-brand text-white font-semibold"
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
              <div className="rounded-lg bg-brandSoft/40 border border-brand/15 p-3">
                <p className="text-micro text-brand font-medium mb-1.5">Elige el rango en el calendario</p>
                <p className="text-small text-ink capitalize leading-snug">
                  {reqStart ? fmtSel(reqStart) : "—"}
                  {reqStart && reqEndEff !== reqStart && <> <span className="text-mutedSoft lowercase">al</span> {fmtSel(reqEndEff)}</>}
                </p>
                <p className="text-micro text-mutedSoft mt-1">
                  {reqWd > 0 ? <>{reqWd} {reqWd === 1 ? "día laborable" : "días laborables"} · findes y festivos no cuentan</> : "Sin días laborables en el rango."}
                </p>
              </div>
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
                <button onClick={submitRequest} disabled={pending || reqWd <= 0 || (reqMsg && reqMsg.ok)} className="btn-brand h-9 flex-1 text-[13px] disabled:opacity-50">
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
                    const t = EVENT_TYPES[e.type];
                    const person = WITH_PERSON.has(e.type) && e.who ? MEMBER.get(e.who) : null;
                    return (
                      <li key={j} className={`rounded-lg border p-2.5 flex items-center gap-3 ${TILE[t.color]}`}>
                        {person?.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-paper" />
                        ) : (
                          <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 bg-paper ${TEXT[t.color]}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${DOT[t.color]}`} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-small text-ink font-medium leading-snug truncate">{e.title}</p>
                          <p className={`text-micro font-medium ${TEXT[t.color]}`}>
                            {t.label}{e.who ? <span className="text-mutedSoft font-normal"> · {e.who}</span> : null}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-8 text-center">
                  <span className="inline-block rounded-full border border-borderStrong/40 px-4 py-1.5 text-[12.5px] text-mutedSoft">
                    Nada este día
                  </span>
                </div>
              )}

              {canRequest && (
                <button onClick={startRequest} className="btn-brand w-full h-10 mt-4 text-[13px] inline-flex items-center justify-center gap-2">
                  🏖️ Solicitar vacaciones
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
