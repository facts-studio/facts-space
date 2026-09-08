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
const ICON = { cumple: "🎂", vacaciones: "🏖️", ausencia: "🌴" };

// Iconos de MynaUI (mynaui.com/icons), la librería del portal: hito =
// HashDiamondSolid, festivo = SunSolid. El resto de tipos van con emoji.
function SvgIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

function FestivoIcon() {
  return (
    <SvgIcon>
      <path d="M12 2.25a.75.75 0 0 1 .75.75v2a.75.75 0 1 1-1.5 0V3a.75.75 0 0 1 .75-.75m0 16.004a.75.75 0 0 1 .75.75v2a.75.75 0 1 1-1.5 0v-2a.75.75 0 0 1 .75-.75M2.25 12a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75m16 0a.75.75 0 0 1 .75-.75h2a.75.75 0 1 1 0 1.5h-2a.75.75 0 0 1-.75-.75m1.28-7.53a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0m-15.06 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06m3.06 12a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0m8.94 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06M12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5" />
    </SvgIcon>
  );
}

function HitoIcon() {
  return (
    <SvgIcon>
      <path d="M10.769 13h1.976l.359-2h-1.976z" />
      <path d="M12 1.25a3.16 3.16 0 0 0-2.235.926L2.177 9.765a3.16 3.16 0 0 0 0 4.47l7.588 7.588a3.16 3.16 0 0 0 4.47 0l7.588-7.588a3.16 3.16 0 0 0 0-4.47l-7.588-7.588A3.16 3.16 0 0 0 12 1.25m-.963 6.012a.75.75 0 0 1 .606.87L11.397 9.5h1.976l.293-1.633a.75.75 0 0 1 1.477.266L14.897 9.5h1.385a.75.75 0 0 1 0 1.5h-1.654l-.36 2h2.014a.75.75 0 0 1 0 1.5H14l-.293 1.633a.75.75 0 0 1-1.477-.265l.246-1.368H10.5l-.293 1.633a.75.75 0 0 1-1.477-.265l.246-1.368H7.718a.75.75 0 0 1 0-1.5h1.527l.359-2H7.718a.75.75 0 0 1 0-1.5h2.155l.293-1.633a.75.75 0 0 1 .871-.605" />
    </SvgIcon>
  );
}

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

// Cada tipo de evento se pinta con su color de EVENT_TYPES, para distinguirlos
// de un vistazo sin leer la etiqueta.
// Clases explícitas: Tailwind no ve las compuestas en tiempo de ejecución.
const TONO = {
  hito: { bubble: "bg-dangerSoft text-danger", ring: "ring-danger/35", label: "text-danger" },
  cumple: { bubble: "bg-infoSoft text-info", ring: "ring-info/35", label: "text-info" },
  festivo: { bubble: "bg-violetSoft text-violet", ring: "ring-violet/35", label: "text-violet" },
  vacaciones: { bubble: "bg-warnSoft text-warn", ring: "ring-warn/35", label: "text-warn" },
  ausencia: { bubble: "bg-successSoft text-success", ring: "ring-success/35", label: "text-success" },
};

// "Cumpleaños Mariola" con la etiqueta "Cumpleaños" justo debajo se lee dos
// veces: el título se queda con lo que cambia (la persona) y el tipo lo dice
// la etiqueta. Si al quitarlo no queda nada, se respeta el título original.
function sinTipo(e) {
  const label = EVENT_TYPES[e.type]?.label;
  if (!label) return e.title;
  const resto = e.title.replace(new RegExp(`^${label}\\s+(de\\s+)?`, "i"), "").trim();
  return resto || e.title;
}

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
                day.events.map((e) => {
                  const v = TONO[e.type];
                  const photo = e.who ? MEMBER.get(e.who)?.photo : null;
                  return (
                    <div key={e.id} className="flex items-center gap-2.5 min-w-0">
                      {photo ? (
                        // El anillo del color del tipo dice qué le pasa a esa
                        // persona sin tener que leer la línea de abajo.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" className={`w-6 h-6 rounded-full object-cover shrink-0 ${v ? `ring-2 ${v.ring}` : ""}`} />
                      ) : (
                        <span className={`w-6 h-6 rounded-full grid place-items-center text-[12px] shrink-0 ${v ? v.bubble : "bg-surface2/70 text-mutedSoft"}`}>
                          {e.type === "hito" ? <HitoIcon /> : e.type === "festivo" ? <FestivoIcon /> : ICON[e.type] || "•"}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-small text-ink truncate leading-tight">{sinTipo(e)}</p>
                        <p className="text-micro text-mutedSoft">
                          <span className={v ? `${v.label} font-medium` : ""}>{EVENT_TYPES[e.type]?.label || e.type}</span>
                          {" · "}{HAS_SPAN.has(e.type) ? spanText(e) : rel(e.dias)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
