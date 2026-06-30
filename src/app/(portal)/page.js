import Link from "next/link";
import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import NovedadesPanel from "@/components/NovedadesPanel";
import { NEWS, LINKS } from "@/lib/mock";
import { CLIENTS } from "@/lib/content";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

// Enlaces de interés = generales + webs de clientes.
const INTEREST = [
  ...LINKS,
  ...CLIENTS.filter((c) => c.links?.[0]?.url).map((c) => ({
    id: c.id, title: c.name, desc: "Cliente", url: c.links[0].url,
  })),
];

const SHORTCUTS = [
  { href: "/calendario", title: "Calendario", desc: "Hitos, cumpleaños, vacaciones y festivos.", icon: "▦" },
  { href: "/politicas", title: "Políticas", desc: "Onboarding y cómo trabajamos.", icon: "❡" },
  { href: "/recursos", title: "Recursos", desc: "Programas, brand assets y enlaces.", icon: "✦" },
];

export default async function HomePage() {
  const [events, me] = await Promise.all([getCalendarEvents(), getCurrentEmployee()]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
      <BirthdayConfetti />
      {/* Columna principal */}
      <div className="min-w-0">
        <TodayHero nombre={nombre} events={events} />

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

        {/* Enlaces de interés */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-title text-ink">Enlaces de interés</h2>
            <span className="count-pill bg-surface2 text-muted">{INTEREST.length}</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {INTEREST.map((l) => {
              const fav = favicon(l.url);
              return (
                <li key={l.id}>
                  <a href={l.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl px-2.5 py-2 -mx-0.5 hover:bg-surface2/60 transition">
                    {fav ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fav} alt="" className="w-7 h-7 rounded-lg shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-brandSoft text-brand grid place-items-center text-[12px] shrink-0">↗</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-small text-ink truncate group-hover:text-brand transition-colors">{l.title}</p>
                      <p className="text-micro text-mutedSoft truncate">{l.desc}</p>
                    </div>
                    <span className="text-mutedSoft text-[13px] opacity-0 group-hover:opacity-100 transition">↗</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Columna derecha — Novedades */}
      <NovedadesPanel news={NEWS} events={events} />
    </div>
  );
}
