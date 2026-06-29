import Link from "next/link";
import { POLICIES } from "@/lib/content";

export default function PoliticasPage() {
  return (
    <div className="max-w-[1200px]">
      {/* Cabecera tipo ficha */}
      <header className="flex items-baseline justify-between mb-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">/ Políticas internas</p>
        <p className="font-mono text-[12px] text-mutedSoft tabular-nums">{String(POLICIES.length).padStart(2, "0")} / {String(POLICIES.length).padStart(2, "0")}</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {POLICIES.map((p, i) => {
          const num = String(i + 1).padStart(2, "0");
          const last = i === POLICIES.length - 1;
          return (
            <Link
              key={p.id}
              href={`/politicas/${p.id}`}
              className="group relative rounded-2xl bg-surface border border-border p-6 min-h-[260px] flex flex-col transition hover:border-borderStrong hover:bg-surface2/40"
            >
              {/* Cabecera de la ficha */}
              <div className="flex items-start justify-between">
                <span className="font-mono text-[13px] text-muted tabular-nums">{num}</span>
                {last && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
              </div>

              <h2 className="font-mono text-[13px] uppercase tracking-[0.1em] text-ink mt-4 leading-snug">
                {p.title}
              </h2>

              {/* Detalle abajo */}
              <div className="mt-auto pt-8">
                <p className="text-small text-muted leading-relaxed">{p.summary}</p>
                <div className="flex items-center justify-between mt-5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-mutedSoft">{p.min} min</span>
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
