import PageHeader from "@/components/PageHeader";
import { CLIENTS } from "@/lib/content";

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

export default function ClientesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Para quién trabajamos"
        title="Clientes"
        helper="F*cts es una sociedad independiente que da servicio a sus clientes. Hoy, nuestro cliente principal es el holding Unfiltrade® y sus proyectos."
      />

      {CLIENTS.map((c) => (
        <section key={c.id} className="mb-10">
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="font-display text-[22px] text-ink">{c.name}</h2>
            <span className="pill bg-surface2 text-mutedSoft">{c.kind}</span>
          </div>
          <p className="text-small text-muted mb-4 max-w-[640px]">{c.desc}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {c.brands.map((b, i) => {
              const num = String(i + 1).padStart(2, "0");
              const fav = b.url ? favicon(b.url) : null;
              return (
                <a
                  key={b.id}
                  href={b.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl bg-surface/55 hover:bg-surface p-6 min-h-[170px] flex flex-col transition"
                >
                  <div className="flex items-center justify-between">
                    {fav ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fav} alt="" className="w-7 h-7 rounded-lg" />
                    ) : (
                      <span className="text-micro text-mutedSoft tabular-nums">{num}</span>
                    )}
                    <span className="text-mutedSoft text-[13px] opacity-0 group-hover:opacity-100 transition">↗</span>
                  </div>
                  <h3 className="text-title text-ink mt-4 group-hover:text-brand transition-colors">{b.name}</h3>
                  {b.tagline && <p className="text-micro text-mutedSoft italic">«{b.tagline}»</p>}
                  <p className="text-small text-muted leading-relaxed mt-2">{b.desc}</p>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
