import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { EventPill } from "@/components/EventBadge";
import { Avatar } from "@/components/EventBadge";
import { EVENTS, EVENT_TYPES, TEAM, fmtRange } from "@/lib/mock";

const SHORTCUTS = [
  { href: "/calendario", title: "Calendario", desc: "Hitos, cumpleaños, vacaciones y festivos.", icon: "▦" },
  { href: "/politicas", title: "Políticas", desc: "Onboarding y cómo trabajamos.", icon: "❡" },
  { href: "/recursos", title: "Recursos", desc: "Programas, brand assets y enlaces.", icon: "✦" },
];

export default function HomePage() {
  const upcoming = EVENTS.slice(0, 5);
  return (
    <>
      <PageHeader
        eyebrow="Bienvenido/a"
        title="El sitio del"
        italic="equipo"
        helper="Todo lo compartido de F*cts Studio, organizado y a mano."
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href} className="row-card p-5 group">
            <div className="w-9 h-9 rounded-xl bg-brandSoft text-brand grid place-items-center text-[15px] mb-4">
              {s.icon}
            </div>
            <h2 className="text-title text-ink mb-1.5 group-hover:text-brand transition-colors">
              {s.title}
            </h2>
            <p className="text-small text-muted leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Próximos eventos */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-title text-ink">Próximamente</h2>
            <Link href="/calendario" className="text-small text-muted hover:text-ink transition">
              Ver calendario →
            </Link>
          </div>
          <ul className="flex flex-col">
            {upcoming.map((e) => {
              const t = EVENT_TYPES[e.type];
              return (
                <li key={e.id} className="flex items-center gap-4 py-3.5 border-b border-border/70 last:border-b-0">
                  <div className="w-14 shrink-0 text-small text-muted tabular-nums">
                    {fmtRange(e.start, e.end)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-ink truncate">{e.title}</p>
                    {e.who && <p className="text-micro text-mutedSoft">{e.who}</p>}
                  </div>
                  <EventPill color={t.color}>{t.label}</EventPill>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Equipo */}
        <section className="card p-6">
          <h2 className="text-title text-ink mb-5">El equipo</h2>
          <ul className="flex flex-col gap-3.5">
            {TEAM.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <Avatar name={m.name} color={m.color} />
                <div className="min-w-0">
                  <p className="text-small text-ink truncate">{m.name}</p>
                  <p className="text-micro text-mutedSoft truncate">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
