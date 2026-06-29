import Link from "next/link";

// Renderiza un array de bloques de contenido (ver src/lib/content.js).
export default function ContentBlocks({ blocks = [] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        if (b.h) return <h2 key={i} className="font-display text-[24px] text-ink mt-6 first:mt-0">{b.h}</h2>;
        if (b.h3) return <h3 key={i} className="text-title text-ink mt-4">{b.h3}</h3>;
        if (b.p) return <p key={i} className="text-body-lg text-inkSoft leading-relaxed">{b.p}</p>;
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
          <p key={i} className="text-body text-muted leading-relaxed bg-surface2/50 border border-border/60 rounded-xl px-4 py-3">
            {b.note}
          </p>
        );
        if (b.table) return (
          <div key={i} className="card overflow-hidden">
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
        return null;
      })}
    </div>
  );
}
