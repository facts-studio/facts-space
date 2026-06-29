import Link from "next/link";
import { notFound } from "next/navigation";
import { COVERS } from "@/components/OnboardingCovers";
import { ONBOARDING } from "@/lib/mock";

export default async function OnboardingStepPage({ params }) {
  const { id } = await params;
  const idx = ONBOARDING.findIndex((s) => s.id === id);
  if (idx === -1) notFound();

  const step = ONBOARDING[idx];
  const prev = ONBOARDING[idx - 1];
  const next = ONBOARDING[idx + 1];
  const Cover = COVERS[step.cover];

  return (
    <div className="max-w-[760px]">
      <Link href="/onboarding" className="text-small text-muted hover:text-ink transition">
        ← Onboarding
      </Link>

      <div className="rounded-2xl overflow-hidden shadow-card bg-[#141413] aspect-[16/7] grid place-items-center p-10 mt-4 mb-7">
        <Cover />
      </div>

      <p className="section-eyebrow mb-2">Paso {step.num} · {step.min} min</p>
      <h1 className="section-title mb-3">{step.title}</h1>
      <p className="section-helper">{step.desc}</p>

      <div className="surface-card-dashed p-10 grid place-items-center text-center mt-8">
        <p className="text-body text-muted max-w-[440px]">
          Aquí irá el contenido de «{step.title}». Editable desde Administrar en la
          siguiente fase.
        </p>
      </div>

      {/* Navegación lineal */}
      <div className="flex items-stretch gap-4 mt-10">
        {prev ? (
          <Link href={`/onboarding/${prev.id}`} className="row-card p-4 flex-1 group">
            <span className="text-micro text-mutedSoft">← Anterior</span>
            <p className="text-body text-ink mt-1 group-hover:text-brand transition-colors">{prev.title}</p>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link href={`/onboarding/${next.id}`} className="row-card p-4 flex-1 text-right group">
            <span className="text-micro text-mutedSoft">Siguiente →</span>
            <p className="text-body text-ink mt-1 group-hover:text-brand transition-colors">{next.title}</p>
          </Link>
        ) : (
          <Link href="/onboarding" className="row-card p-4 flex-1 text-right group">
            <span className="text-micro text-mutedSoft">Final</span>
            <p className="text-body text-ink mt-1 group-hover:text-brand transition-colors">Volver al inicio</p>
          </Link>
        )}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return ONBOARDING.map((s) => ({ id: s.id }));
}
