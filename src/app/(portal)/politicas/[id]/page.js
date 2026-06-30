import Link from "next/link";
import { notFound } from "next/navigation";
import ContentBlocks from "@/components/ContentBlocks";
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
        <div className="text-[28px] mb-3">{p.icon}</div>
        <h1 className="section-title">{p.title}</h1>
        <p className="section-helper">{p.summary}</p>
      </header>
    </>
  );

  return (
    <div>
      {Head}
      <ContentBlocks blocks={p.body} />
      {withChecker && <VacacionesChecker />}
    </div>
  );
}

export function generateStaticParams() {
  return POLICIES.map((p) => ({ id: p.id }));
}
