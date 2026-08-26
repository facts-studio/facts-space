import Link from "next/link";
import { notFound } from "next/navigation";
import PolicyReader from "@/components/PolicyReader";
import VacacionesChecker from "@/components/VacacionesChecker";
import { POLICIES } from "@/lib/content";

export default async function PoliticaPage({ params }) {
  const { id } = await params;
  const p = POLICIES.find((x) => x.id === id);
  if (!p) notFound();

  const withChecker = id === "vacaciones";

  const Head = (
    <>
      <Link href="/politicas" className="text-small text-muted hover:text-ink transition">← Políticas</Link>
      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-[26px] leading-none shrink-0" aria-hidden>{p.icon}</span>
          <h1 className="section-title">{p.title}</h1>
        </div>
        <p className="section-helper">{p.summary}</p>
      </header>
    </>
  );

  return (
    <div>
      {Head}
      <PolicyReader blocks={p.body}>
        {withChecker && <VacacionesChecker />}
      </PolicyReader>
    </div>
  );
}

export function generateStaticParams() {
  return POLICIES.map((p) => ({ id: p.id }));
}
