import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { POLICIES, POLICY_GROUPS } from "@/lib/content";

const byId = new Map(POLICIES.map((p) => [p.id, p]));

export default function PoliticasPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Cómo trabajamos"
        title="Políticas"
        helper="Horarios, vacaciones, comunicación, organización y seguridad del estudio."
      />

      <div className="flex flex-col gap-10">
        {POLICY_GROUPS.map((g) => (
          <section key={g.name}>
            <div className="mb-4">
              <p className="section-eyebrow mb-1">{g.eyebrow}</p>
              <h2 className="font-display text-[22px] text-ink">{g.name}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {g.ids.map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <Link key={id} href={`/politicas/${id}`} className="row-card p-5 group flex flex-col">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-[18px]">{p.icon}</span>
                      <h3 className="text-title text-ink group-hover:text-brand transition-colors">{p.title}</h3>
                    </div>
                    <p className="text-small text-muted leading-relaxed flex-1">{p.summary}</p>
                    <span className="text-micro text-mutedSoft mt-4">{p.min} min de lectura</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
