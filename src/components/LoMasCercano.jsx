"use client";

// "Lo más cercano": agenda de próximos eventos agrupados por día. Reutilizable
// en Inicio (TodayHero) y en la vista de Tareas (modo Status para admins).
import { useState } from "react";
import { EVENT_TYPES, TEAM } from "@/lib/mock";
import { Surface } from "@/components/ui";

const MEMBER = new Map(TEAM.map((m) => [m.name, m]));
const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parse = (iso) => new Date(iso + "T00:00:00");
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diasHasta = (iso, hoy) => Math.round((startOfDay(parse(iso)) - hoy) / DAY);
const ICON = { cumple: "🎂", festivo: "🗓️", hito: "🎯", vacaciones: "🏖️", ausencia: "🌴" };

function rel(dias) {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias < 7) return `en ${dias} días`;
  if (dias < 14) return "la semana que viene";
  if (dias < 31) return `en ${Math.round(dias / 7)} semanas`;
  if (dias < 60) return "el mes que viene";
  return `en ${Math.round(dias / 30)} meses`;
}

const mes = (d) => d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
// Duración de las vacaciones/ausencias: "del 20 al 24 jul" / "del 28 jun al 3 jul".
function spanText(e) {
  if (!e.end || e.end === e.start) return rel(e.dias);
  const a = parse(e.start), b = parse(e.end);
  return a.getMonth() === b.getMonth()
    ? `del ${a.getDate()} al ${b.getDate()} ${mes(b)}`
    : `del ${a.getDate()} ${mes(a)} al ${b.getDate()} ${mes(b)}`;
}
const HAS_SPAN = new Set(["vacaciones", "ausencia"]);

// Flecha de navegación por días.
function Arrow({ dir, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Días anteriores" : "Días siguientes"}
      className="h-7 w-7 grid place-items-center rounded-lg text-mutedSoft hover:text-ink hover:bg-surface2/60 transition disabled:opacity-25 disabled:pointer-events-none"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

const VISIBLE_DAYS = 4;

export default function LoMasCercano({ events = [], className = "" }) {
  // Desplazamiento dentro de la agenda: 0 = hoy arriba del todo.
  const [offset, setOffset] = useState(0);
  const hoy = startOfDay(new Date());
  const futuros = events
    .map((e) => ({ ...e, dias: diasHasta(e.start, hoy) }))
    .filter((e) => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias);
  // Sin nada próximo, el bloque no se pinta (igual que antes de la navegación).
  if (!futuros.length) return null;

  const todayISO = isoOf(hoy);
  const byDate = new Map();
  for (const e of futuros) {
    if (!byDate.has(e.start)) byDate.set(e.start, []);
    byDate.get(e.start).push(e);
  }
  const nextDates = [...byDate.keys()].filter((d) => d > todayISO).sort();
  const dates = [todayISO, ...nextDates];
  // Si el desplazamiento se sale (p. ej. al llegar datos nuevos), se recorta.
  const maxOffset = Math.max(0, dates.length - VISIBLE_DAYS);
  const off = Math.min(offset, maxOffset);
  const agenda = dates.slice(off, off + VISIBLE_DAYS).map((iso) => {
    const d = parse(iso);
    return {
      iso,
      num: d.getDate(),
      month: d.toLocaleDateString("es-ES", { month: "long" }),
      weekday: d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""),
      events: byDate.get(iso) || [],
    };
  });

  return (
    <Surface variant="raised" pad="none" className={`rounded-[28px] p-6 md:p-8 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="section-eyebrow">Lo más cercano</p>
        <div className="flex items-center gap-1 shrink-0">
          {/* "Hoy" solo cuando te has movido: devuelve al principio. */}
          {off > 0 && (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="h-7 px-2.5 rounded-lg text-micro text-muted hover:text-ink hover:bg-surface2/60 transition"
            >
              Hoy
            </button>
          )}
          <Arrow dir="prev" onClick={() => setOffset((o) => Math.max(0, Math.min(o, maxOffset) - 1))} disabled={off === 0} />
          <Arrow dir="next" onClick={() => setOffset((o) => Math.min(maxOffset, Math.min(o, maxOffset) + 1))} disabled={off >= maxOffset} />
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {agenda.map((day) => (
          <div key={day.iso} className="flex gap-5 py-4 first:pt-3 last:pb-1">
            <div className="w-[108px] shrink-0 flex items-start gap-2.5">
              <span className="font-display text-[28px] leading-none text-ink tabular-nums w-[1.1em] text-right shrink-0">{day.num}</span>
              <span className="leading-tight">
                <span className="block text-[13px] leading-none text-ink capitalize">{day.weekday}</span>
                <span className="block text-micro leading-none text-mutedSoft capitalize mt-1 truncate">{day.month}</span>
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              {day.events.length === 0 ? (
                <p className="text-small text-mutedSoft">No hay más eventos hoy</p>
              ) : (
                day.events.map((e) => (
                  <div key={e.id} className="flex items-center gap-2.5 min-w-0">
                    {e.who && MEMBER.get(e.who)?.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={MEMBER.get(e.who).photo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-surface2/70 grid place-items-center text-[12px] shrink-0">{ICON[e.type] || "•"}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-small text-ink truncate leading-tight">{e.title}</p>
                      <p className="text-micro text-mutedSoft">{EVENT_TYPES[e.type]?.label || e.type} · {HAS_SPAN.has(e.type) ? spanText(e) : rel(e.dias)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
