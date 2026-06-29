import PageHeader from "@/components/PageHeader";
import { POLICY_CATEGORIES, fmtDate } from "@/lib/mock";

export default function PoliticasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cómo trabajamos"
        title="Políticas"
        helper="Onboarding, política de vacaciones y guías internas del estudio."
      />

      <div className="flex flex-col gap-10">
        {POLICY_CATEGORIES.map((cat) => (
          <section key={cat.name}>
            <div className="mb-4">
              <p className="section-eyebrow mb-1">{cat.eyebrow}</p>
              <h2 className="font-display text-[22px] text-ink">{cat.name}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.policies.map((p) => (
                <a key={p.id} href="#" className="row-card p-5 group flex flex-col">
                  <h3 className="text-title text-ink mb-1.5 group-hover:text-brand transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-small text-muted leading-relaxed flex-1">{p.summary}</p>
                  <div className="flex items-center gap-3 mt-4 text-micro text-mutedSoft">
                    <span>{p.min} min de lectura</span>
                    <span className="w-1 h-1 rounded-full bg-borderStrong" />
                    <span>Act. {fmtDate(p.updated)}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
