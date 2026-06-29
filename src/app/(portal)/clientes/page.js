import PageHeader from "@/components/PageHeader";
import { CLIENTS } from "@/lib/content";

export default function ClientesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Para quién trabajamos"
        title="Clientes"
        helper="F*cts es una sociedad independiente que da servicio a sus clientes. Hoy, nuestro cliente principal es el holding Unfiltrade® y sus proyectos."
      />

      {CLIENTS.map((c) => (
        <section key={c.id} className="mb-10">
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="font-display text-[22px] text-ink">{c.name}</h2>
            <span className="pill bg-surface2 text-mutedSoft">{c.kind}</span>
          </div>
          <p className="text-small text-muted mb-4 max-w-[640px]">{c.desc}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {c.brands.map((b, i) => {
              const num = String(i + 1).padStart(2, "0");
              return (
                <div key={b.id} className="rounded-2xl bg-surface/55 p-6 min-h-[150px] flex flex-col">
                  <span className="text-micro text-mutedSoft tabular-nums">{num}</span>
                  <h3 className="text-title text-ink mt-3">{b.name}</h3>
                  <p className="text-small text-muted leading-relaxed mt-1">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
