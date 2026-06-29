import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { POLICIES } from "@/lib/content";

export default function PoliticasPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Cómo trabajamos"
        title="Políticas"
        helper="Horarios, vacaciones, comunicación, organización y seguridad del estudio."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {POLICIES.map((p, i) => {
          const num = String(i + 1).padStart(2, "0");
          const last = i === POLICIES.length - 1;
          return (
            <Link
              key={p.id}
              href={`/politicas/${p.id}`}
              className="group rounded-2xl bg-surface/55 p-6 min-h-[180px] flex flex-col transition hover:bg-surface"
            >
              <div className="flex items-start justify-between">
                <span className="text-micro text-mutedSoft tabular-nums">{num}</span>
                {last && <span className="w-2 h-2 rounded-full bg-brand" />}
              </div>

              <h2 className="text-title text-ink mt-3 group-hover:text-brand transition-colors">
                {p.title}
              </h2>

              <div className="mt-auto pt-6">
                <p className="text-small text-muted leading-relaxed">{p.summary}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-micro text-mutedSoft">{p.min} min de lectura</span>
                  <span className="text-mutedSoft text-[14px] -translate-x-1 group-hover:translate-x-0 group-hover:text-ink transition">→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
