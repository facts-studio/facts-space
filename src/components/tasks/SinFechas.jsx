import Link from "next/link";
import { Badge } from "@/components/ui";

// Proyectos que aún no tienen fechas. No se pueden situar en una línea de
// tiempo, pero existen y hay que poder verlos: van en una franja al pie, con
// su fase, para que el mapa esté completo.
export default function SinFechas({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="shrink-0 border-t border-border/60 px-5 md:px-10 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-micro uppercase tracking-wide text-mutedSoft shrink-0">Sin fechas</span>
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/sprint/${p.id}`}
          className="inline-flex items-center gap-2 h-7 pl-2.5 pr-1.5 rounded-lg bg-surface2/50 hover:bg-surface2 transition"
        >
          <span className="text-[12.5px] text-inkSoft">{p.name}</span>
          {p.client && <span className="text-micro text-mutedSoft">{p.client}</span>}
          {p.phase && <Badge kind={p.phase.badge}>{p.phase.estado}</Badge>}
        </Link>
      ))}
    </div>
  );
}
