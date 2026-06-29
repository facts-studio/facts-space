"use client";

import { useMemo, useState } from "react";
import { EVENT_TYPES, TEAM } from "@/lib/mock";

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

// Acabado del chip por tipo de evento (clases explícitas para Tailwind).
const CHIP = {
  hito: "bg-brand text-white",
  cumple: "bg-infoSoft text-info",
  vacaciones: "bg-warnSoft text-warn",
  festivo: "bg-violetSoft text-violet",
};
const DOT = {
  brand: "bg-brand", info: "bg-info", warn: "bg-warn", violet: "bg-violet",
};
// Tile del panel del día: fondo suave + borde + acento por tipo.
const TILE = {
  brand: "bg-brandSoft/60 border-brand/15",
  info: "bg-infoSoft/55 border-info/15",
  warn: "bg-warnSoft/45 border-warn/15",
  violet: "bg-violetSoft/55 border-violet/15",
};
const TEXT = {
  brand: "text-brand", info: "text-info", warn: "text-warn", violet: "text-violet",
};
// Acabado del chip de filtro activo por color (clases explícitas).
const FILTER_ON = {
  brand: "bg-brandSoft text-brand border-brand/30",
  info: "bg-infoSoft text-info border-info/30",
  warn: "bg-warnSoft text-warn border-warn/30",
  violet: "bg-violetSoft text-violet border-violet/30",
};

export default function CalendarMonth({ events = [] }) {
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

  return (
    <div className={`h-[calc(100vh-5rem)] ${selected ? "lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 lg:items-stretch" : ""}`}>
      <div className="flex flex-col min-h-0 h-full">
        {/* Cabecera de mes */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-[24px] text-ink capitalize leading-none flex items-baseline gap-2">
            {MESES[month]}
            <span className="font-sans font-normal text-[14px] text-mutedSoft tabular-nums">{year}</span>
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-1.5 rounded-lg text-[12.5px] text-inkSoft hover:bg-surface2/60 transition mr-1">Hoy</button>
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior" className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface2/60 active:scale-95 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente" className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface2/60 active:scale-95 transition">
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
            return (
              <div
                key={i}
                onClick={() => setSelected((cur) => (cur === k ? null : k))}
                className={`h-full min-h-[84px] rounded-xl border p-1.5 flex flex-col gap-1 cursor-pointer transition ${
                  isToday
                    ? "border-brand/55 bg-brand/[0.045] ring-1 ring-brand/30"
                    : isSel
                      ? "border-ink/45 bg-surface2/40"
                      : hasFestivo
                        ? "border-violet/20 bg-violetSoft/45 hover:border-violet/35"
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
      </div>

      {/* Panel del día seleccionado */}
      {selected && (
        <aside className="mt-6 lg:mt-0 lg:h-full lg:overflow-y-auto rounded-2xl border border-border/60 bg-surface/40 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] uppercase tracking-[0.12em] text-mutedSoft capitalize">{fmtSel(selected)}</span>
            <button onClick={() => setSelected(null)} aria-label="Cerrar" className="h-6 w-6 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          {selItems.length > 0 ? (
            <ul className="space-y-2">
              {selItems.map((e, j) => {
                const t = EVENT_TYPES[e.type];
                const person = WITH_PERSON.has(e.type) && e.who ? MEMBER.get(e.who) : null;
                return (
                  <li key={j} className={`rounded-xl border p-2.5 flex items-center gap-3 ${TILE[t.color]}`}>
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
            <div className="text-center text-mutedSoft text-[13px] py-8">Nada este día.</div>
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
