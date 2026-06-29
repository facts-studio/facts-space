import PageHeader from "@/components/PageHeader";
import { HOLDING } from "@/lib/content";

export default function HoldingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Unfiltrade®"
        title="El holding"
        helper="F*cts es una sociedad independiente, pero formamos parte del ecosistema de Unfiltrade y damos soporte a toda su infraestructura: estrategia, comunicación, diseño y desarrollo de producto."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {HOLDING.map((b, i) => {
          const num = String(i + 1).padStart(2, "0");
          return (
            <div key={b.id} className="rounded-2xl bg-surface/55 p-6 min-h-[160px] flex flex-col">
              <span className="text-micro text-mutedSoft tabular-nums">{num}</span>
              <h2 className="text-title text-ink mt-3">{b.name}</h2>
              <p className="text-small text-muted leading-relaxed mt-1">{b.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
