import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { TOOLS, HOLDING } from "@/lib/content";

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

export default function RecursosPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Compartido"
        title="Recursos"
        helper="Las herramientas del día a día y las marcas del ecosistema Unfiltrade®."
      />

      {/* Herramientas */}
      <section className="mb-12">
        <h2 className="font-display text-[22px] text-ink mb-4">Herramientas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((t) => {
            const fav = favicon(t.url);
            return (
              <Link key={t.id} href={`/recursos/${t.id}`} className="row-card p-5 group flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  {fav ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fav} alt="" className="w-8 h-8 rounded-lg shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-brandSoft text-brand grid place-items-center">✦</span>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-body text-ink font-medium truncate group-hover:text-brand transition-colors">{t.name}</h3>
                    <span className="text-micro text-mutedSoft">{t.tag}</span>
                  </div>
                </div>
                <p className="text-small text-muted leading-relaxed line-clamp-3">{t.what}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Marcas del holding */}
      <section>
        <h2 className="font-display text-[22px] text-ink mb-1">Marcas del holding</h2>
        <p className="text-small text-muted mb-4">Proyectos del ecosistema Unfiltrade® a los que damos soporte.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOLDING.map((b) => (
            <div key={b.id} className="card p-5">
              <h3 className="text-title text-ink mb-1">{b.name}</h3>
              <p className="text-small text-muted leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
