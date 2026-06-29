import Link from "next/link";
import { notFound } from "next/navigation";
import { TOOLS } from "@/lib/content";

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

function List({ title, items, accent }) {
  return (
    <div>
      <h2 className="section-eyebrow mb-3">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-body-lg text-inkSoft leading-relaxed">
            <span className={`mt-[0.1em] shrink-0 ${accent}`}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ToolPage({ params }) {
  const { id } = await params;
  const t = TOOLS.find((x) => x.id === id);
  if (!t) notFound();
  const fav = favicon(t.url);

  return (
    <div className="max-w-[760px]">
      <Link href="/recursos" className="text-small text-muted hover:text-ink transition">← Recursos</Link>

      <header className="mt-4 mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {fav && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fav} alt="" className="w-12 h-12 rounded-xl" />
          )}
          <div>
            <h1 className="section-title">{t.name}</h1>
            <p className="text-small text-mutedSoft">{t.tag}</p>
          </div>
        </div>
        <a href={t.url} target="_blank" rel="noreferrer" className="btn-primary">Abrir ↗</a>
      </header>

      <p className="text-body-lg text-inkSoft leading-relaxed mb-8">{t.what}</p>

      <div className="grid sm:grid-cols-2 gap-8">
        <List title="Cuándo lo usamos" items={t.when} accent="text-brand" />
        <List title="Qué evitar" items={t.avoid} accent="text-danger" />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return TOOLS.map((t) => ({ id: t.id }));
}
