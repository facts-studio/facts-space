import Link from "next/link";
import TodayHero from "@/components/TodayHero";
import NovedadesPanel from "@/components/NovedadesPanel";
import { Avatar } from "@/components/EventBadge";
import { EVENTS, NEWS, TEAM } from "@/lib/mock";

const SHORTCUTS = [
  { href: "/calendario", title: "Calendario", desc: "Hitos, cumpleaños, vacaciones y festivos.", icon: "▦" },
  { href: "/politicas", title: "Políticas", desc: "Onboarding y cómo trabajamos.", icon: "❡" },
  { href: "/recursos", title: "Recursos", desc: "Programas, brand assets y enlaces.", icon: "✦" },
];

export default function HomePage() {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
      {/* Columna principal */}
      <div className="min-w-0 max-w-[820px]">
        <TodayHero nombre="equipo" events={EVENTS} />

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
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

        {/* Equipo */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-title text-ink">El equipo</h2>
            <span className="count-pill bg-surface2 text-muted">{TEAM.length}</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
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

      {/* Columna derecha — Novedades */}
      <NovedadesPanel news={NEWS} events={EVENTS} />
    </div>
  );
}
