import PageHeader from "@/components/PageHeader";
import { RESOURCE_CATEGORIES } from "@/lib/mock";

export default function RecursosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Compartido"
        title="Recursos"
        helper="Programas contratados, brand assets, plantillas y enlaces del estudio."
      />

      <div className="flex flex-col gap-10">
        {RESOURCE_CATEGORIES.map((cat) => (
          <section key={cat.name}>
            <h2 className="font-display text-[22px] text-ink mb-4">{cat.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.resources.map((r) => {
                let host = "";
                try { host = new URL(r.url).hostname.replace("www.", ""); } catch {}
                return (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="row-card p-5 group flex items-start gap-3.5"
                  >
                    {host ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                        alt=""
                        className="w-8 h-8 rounded-lg shrink-0 mt-0.5"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-brandSoft text-brand grid place-items-center text-[13px] shrink-0">✦</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-body text-ink truncate group-hover:text-brand transition-colors">
                          {r.title}
                        </h3>
                        <span className="text-mutedSoft text-[12px] opacity-0 group-hover:opacity-100 transition">↗</span>
                      </div>
                      <p className="text-micro text-muted leading-relaxed mt-0.5">{r.desc}</p>
                      <span className="pill bg-surface2 text-mutedSoft mt-2.5">{r.tag}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
