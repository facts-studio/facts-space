import Link from "next/link";

// Paletas por tono (tokens del design system).
const TONES = {
  brand: { bg: "bg-brandSoft/55", text: "text-brand", bar: "bg-brand" },
  info: { bg: "bg-infoSoft/55", text: "text-info", bar: "bg-info" },
  success: { bg: "bg-successSoft/55", text: "text-success", bar: "bg-success" },
  warn: { bg: "bg-warnSoft/45", text: "text-warn", bar: "bg-warn" },
  danger: { bg: "bg-dangerSoft/45", text: "text-danger", bar: "bg-danger" },
  violet: { bg: "bg-violetSoft/50", text: "text-violet", bar: "bg-violet" },
  muted: { bg: "bg-surface2/60", text: "text-muted", bar: "bg-mutedSoft" },
};
const tone = (t) => TONES[t] || TONES.muted;

// Renderiza un array de bloques de contenido (ver src/lib/content.js).
export default function ContentBlocks({ blocks = [] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        if (b.h) return <h2 key={i} className="font-display text-[24px] text-ink mt-6 first:mt-0">{b.h}</h2>;
        if (b.h3) return <h3 key={i} className="text-title text-ink mt-4">{b.h3}</h3>;
        if (b.p) return <p key={i} className="text-body-lg text-inkSoft leading-relaxed max-w-[70ch]">{b.p}</p>;
        if (b.ul) return (
          <ul key={i} className="flex flex-col gap-2">
            {b.ul.map((it, j) => (
              <li key={j} className="flex gap-2.5 text-body-lg text-inkSoft leading-relaxed">
                <span className="text-brand mt-[0.1em] shrink-0">·</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        );
        if (b.check) return (
          <ul key={i} className="flex flex-col gap-2">
            {b.check.map((it, j) => (
              <li key={j} className="flex items-center gap-3 text-body-lg text-inkSoft">
                <span className="w-5 h-5 rounded-md border border-borderStrong grid place-items-center text-[11px] text-mutedSoft shrink-0">✓</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        );
        if (b.note) return (
          <p key={i} className="border-l-2 border-borderStrong/50 pl-4 text-body text-muted leading-relaxed italic">
            {b.note}
          </p>
        );
        // Banda de cifras (sin caja): grandes números con divisores.
        if (b.figures) return (
          <div key={i} className="flex flex-wrap gap-y-5">
            {b.figures.map((f, j) => (
              <div key={j} className="pr-8 mr-8 border-r border-border last:border-r-0 last:mr-0 last:pr-0">
                <div className="font-display text-[40px] leading-none tracking-[-0.02em] text-ink">{f.n}</div>
                <div className="text-small text-ink mt-2">{f.label}</div>
                {f.sub && <div className="text-micro text-mutedSoft">{f.sub}</div>}
              </div>
            ))}
          </div>
        );
        // Carga anual: tabla limpia por trimestre.
        if (b.loadbar) return (
          <div key={i} className="rounded-2xl bg-surface/55 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-[0.14em] text-mutedSoft">
                  <th className="font-medium px-5 py-3">Trimestre</th>
                  <th className="font-medium px-3 py-3 hidden sm:table-cell">Meses</th>
                  <th className="font-medium px-3 py-3">Días</th>
                  <th className="font-medium px-5 py-3 text-right">Carga</th>
                </tr>
              </thead>
              <tbody>
                {b.loadbar.map((q, j) => {
                  const tn = tone(q.tone);
                  return (
                    <tr key={j} className="border-t border-border">
                      <td className="px-5 py-3.5 text-body text-ink font-medium">{q.q}</td>
                      <td className="px-3 py-3.5 text-small text-muted hidden sm:table-cell">{q.months}</td>
                      <td className="px-3 py-3.5 text-body text-ink tabular-nums">{q.days} días</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium ${tn.bg} ${tn.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tn.bar}`} />
                          {q.level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        // Lista de definición (filas hairline, sin caja).
        if (b.deflist) return (
          <dl key={i} className="border-t border-border">
            {b.deflist.map((it, j) => (
              <div key={j} className="flex items-center justify-between gap-4 py-3.5 border-b border-border">
                <dt className="text-body text-ink">{it.label}</dt>
                <dd className="text-small text-muted text-right">{it.value}</dd>
              </div>
            ))}
          </dl>
        );
        if (b.table) return (
          <div key={i} className="rounded-2xl bg-surface/55 overflow-hidden">
            <table className="table">
              <thead><tr>{b.table.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
              <tbody>
                {b.table.rows.map((row, j) => (
                  <tr key={j}>{row.map((c, k) => <td key={k} className={k === 0 ? "text-ink" : "text-muted"}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        if (b.link) return (
          <Link key={i} href={b.link.href} className="text-body-lg text-brand hover:underline w-fit">{b.link.label}</Link>
        );
        // Stats: números grandes (cifras clave).
        if (b.stats) return (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {b.stats.map((s, j) => (
              <div key={j} className="rounded-2xl bg-surface/55 p-5">
                <div className="font-display text-[36px] text-ink leading-none tracking-[-0.02em]">{s.n}</div>
                <div className="text-small text-ink mt-2.5">{s.label}</div>
                {s.sub && <div className="text-micro text-mutedSoft mt-0.5">{s.sub}</div>}
              </div>
            ))}
          </div>
        );
        // Trimestres: tarjeta con días, nivel de carga y barra.
        if (b.quarters) return (
          <div key={i} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {b.quarters.map((q, j) => {
              const tn = tone(q.tone);
              return (
                <div key={j} className="rounded-2xl bg-surface/55 p-5 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-title text-ink">{q.q}</span>
                    <span className="text-micro text-mutedSoft">{q.months}</span>
                  </div>
                  <div className="font-display text-[26px] text-ink leading-none">
                    {q.days} <span className="text-small text-muted">días</span>
                  </div>
                  <div className={`text-[10.5px] uppercase tracking-[0.12em] font-medium ${tn.text}`}>{q.level}</div>
                  <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
                    <div className={`h-full rounded-full ${tn.bar}`} style={{ width: q.fill }} />
                  </div>
                  {q.note && <p className="text-micro text-muted leading-snug">{q.note}</p>}
                </div>
              );
            })}
          </div>
        );
        // Tarjetas tintadas con lista.
        if (b.cards) return (
          <div key={i} className="grid sm:grid-cols-3 gap-3">
            {b.cards.map((c, j) => {
              const tn = tone(c.tone);
              return (
                <div key={j} className={`rounded-2xl p-5 ${tn.bg}`}>
                  <div className={`text-body font-semibold mb-3 ${tn.text}`}>{c.title}</div>
                  <ul className="flex flex-col gap-2">
                    {c.items.map((it, k) => (
                      <li key={k} className="text-small text-inkSoft leading-snug flex gap-2">
                        <span className={`${tn.text} shrink-0`}>·</span><span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
        // Timeline / filas etiqueta → valor.
        if (b.timeline) return (
          <div key={i} className="rounded-2xl bg-surface/55 overflow-hidden">
            {b.timeline.map((t, j) => (
              <div key={j} className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-border/70 last:border-b-0">
                <span className="text-body text-ink">{t.label}</span>
                <span className="text-small text-muted text-right">{t.value}</span>
              </div>
            ))}
          </div>
        );
        // Franja semanal (oficina / remoto).
        if (b.week) return (
          <div key={i} className="grid grid-cols-5 gap-2">
            {b.week.map((d, j) => {
              const tn = tone(d.tone);
              return (
                <div key={j} className={`rounded-xl p-3.5 text-center ${tn.bg}`}>
                  <div className="text-caption uppercase tracking-[0.1em] text-mutedSoft">{d.d}</div>
                  <div className={`text-small font-medium mt-1.5 ${tn.text}`}>{d.label}</div>
                </div>
              );
            })}
          </div>
        );
        return null;
      })}
    </div>
  );
}
