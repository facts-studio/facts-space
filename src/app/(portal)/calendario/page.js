import PageHeader from "@/components/PageHeader";
import CalendarMonth from "@/components/CalendarMonth";
import { EventPill } from "@/components/EventBadge";
import { EVENTS, EVENT_TYPES, fmtRange } from "@/lib/mock";

export default function CalendarioPage() {
  const sorted = [...EVENTS].sort((a, b) => a.start.localeCompare(b.start));
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Equipo"
        title="Calendario"
        helper="Hitos, cumpleaños, vacaciones y festivos del equipo."
      />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <CalendarMonth year={2026} month={6} events={EVENTS} />

        <section className="card p-6">
          <h2 className="text-title text-ink mb-5">Próximos eventos</h2>
          <ul className="flex flex-col">
            {sorted.map((e) => {
              const t = EVENT_TYPES[e.type];
              return (
                <li key={e.id} className="flex items-start gap-3 py-3.5 border-b border-border/70 last:border-b-0">
                  <div className="w-16 shrink-0 text-small text-muted tabular-nums pt-0.5">
                    {fmtRange(e.start, e.end)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-ink">{e.title}</p>
                    {e.who && <p className="text-micro text-mutedSoft mt-0.5">{e.who}</p>}
                  </div>
                  <EventPill color={t.color}>{t.label}</EventPill>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
