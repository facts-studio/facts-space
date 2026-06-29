import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { COVERS } from "@/components/OnboardingCovers";
import { ONBOARDING } from "@/lib/mock";

const totalMin = ONBOARDING.reduce((a, s) => a + s.min, 0);

export default function OnboardingPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Para empezar"
        title="Onboarding"
        helper="¿Acabas de entrar? Este es tu recorrido por F*cts, paso a paso: qué somos, cómo trabajamos, quién es quién y qué usamos."
        action={
          <span className="pill bg-surface2 text-muted whitespace-nowrap">
            {ONBOARDING.length} pasos · ~{totalMin} min
          </span>
        }
      />

      {/* Galería de portadas */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))] mb-12">
        {ONBOARDING.map((s) => {
          const Cover = COVERS[s.cover];
          return (
            <Link
              key={s.id}
              href={`/onboarding/${s.id}`}
              className="group rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover transition bg-paper"
            >
              <div className="relative aspect-[16/11] bg-[#141413] grid place-items-center p-7">
                <span className="absolute top-3 left-3.5 text-[11px] font-medium tabular-nums text-white/40">
                  {s.num}
                </span>
                <Cover />
              </div>
              <div className="flex items-center gap-2 px-4 py-3.5">
                <span className="text-[13px] text-muted">{s.icon}</span>
                <span className="text-small text-ink font-medium truncate group-hover:text-brand transition-colors">
                  {s.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recorrido lineal */}
      <p className="section-eyebrow mb-5">El recorrido</p>
      <ol className="relative border-l border-border ml-3">
        {ONBOARDING.map((s) => (
          <li key={s.id} className="relative pl-7 pb-7 last:pb-0">
            <span className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-brandSoft border-2 border-brand" />
            <Link href={`/onboarding/${s.id}`} className="group block">
              <div className="flex items-baseline gap-2.5">
                <span className="text-micro tabular-nums text-mutedSoft">{s.num}</span>
                <h3 className="text-title text-ink group-hover:text-brand transition-colors">
                  {s.title}
                </h3>
                <span className="text-micro text-mutedSoft">· {s.min} min</span>
              </div>
              <p className="text-small text-muted leading-relaxed mt-1 max-w-[560px]">{s.desc}</p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
