import { EVENT_TYPES } from "@/lib/mock";
import { EventDot } from "@/components/EventBadge";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];

// Rejilla mensual estática (server component). month: 0-11, year: número.
export default function CalendarMonth({ year, month, events }) {
  const first = new Date(year, month, 1);
  const monthName = first.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=domingo → convertir a lunes=0.
  const startOffset = (first.getDay() + 6) % 7;

  // Mapa día → eventos (un evento cubre su rango).
  const byDay = {};
  for (const e of events) {
    const s = new Date(e.start + "T00:00:00");
    const en = new Date(e.end + "T00:00:00");
    for (let d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        (byDay[day] ||= []).push(e);
      }
    }
  }

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="card p-5">
      <p className="font-display text-[20px] text-ink capitalize mb-4">{monthName}</p>
      <div className="grid grid-cols-7 gap-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[10.5px] uppercase tracking-[0.16em] text-mutedSoft pb-2">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={[
              "aspect-square rounded-xl p-1.5 flex flex-col",
              day ? "bg-surface/60" : "",
            ].join(" ")}
          >
            {day && (
              <>
                <span className="text-micro text-muted tabular-nums">{day}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(byDay[day] || []).slice(0, 4).map((e, j) => (
                    <EventDot key={j} color={EVENT_TYPES[e.type].color} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border/70">
        {Object.entries(EVENT_TYPES).map(([k, t]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-micro text-muted">
            <EventDot color={t.color} /> {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
