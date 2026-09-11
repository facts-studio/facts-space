"use client";

// Vista global de proyectos en el tiempo: una fila por proyecto, agrupadas por
// cliente, sobre una escala de meses. Sirve para ver de un vistazo qué ocupa
// cada uno y dónde se solapan, que es justo lo que no se ve proyecto a proyecto.
import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";

const DAY = 86400000;
const MES = (d) => d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
const dm = (ts) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export default function TimelineGlobal({ projects = [], now = null }) {
  // Escala: del primer inicio al último fin, redondeado a meses completos para
  // que la cabecera cuadre con las columnas.
  const [soloActivos, setSoloActivos] = useState(false);
  // `now` llega del servidor: leer el reloj al pintar hace impuro el render.
  const hoy = now ?? 0;

  const visibles = useMemo(
    () => (soloActivos ? projects.filter((p) => p.due >= hoy) : projects),
    [projects, soloActivos, hoy]
  );

  const escala = useMemo(() => {
    if (!visibles.length) return null;
    const min = Math.min(...visibles.map((p) => p.start));
    const max = Math.max(...visibles.map((p) => p.due));
    const desde = startOfMonth(new Date(min));
    const hasta = addMonths(startOfMonth(new Date(max)), 1);
    const meses = [];
    for (let d = new Date(desde); d < hasta; d = addMonths(d, 1)) meses.push(new Date(d));
    const total = hasta - desde;
    return { desde: desde.getTime(), total, meses };
  }, [visibles]);

  const grupos = useMemo(() => {
    const map = new Map();
    for (const p of visibles) {
      const k = p.client || "Sin cliente";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(p);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start - b.start);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [visibles]);

  if (!escala) return <EmptyState>No hay proyectos con fechas.</EmptyState>;

  const pct = (ts) => ((ts - escala.desde) / escala.total) * 100;
  const hoyPct = pct(hoy);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-micro text-mutedSoft">
          {visibles.length} proyecto{visibles.length === 1 ? "" : "s"} · {escala.meses.length} meses
        </p>
        <button
          type="button"
          onClick={() => setSoloActivos((v) => !v)}
          className={`h-7 px-2.5 rounded-lg text-micro transition ${soloActivos ? "bg-ink text-bg" : "text-muted hover:text-ink hover:bg-surface2/60"}`}
        >
          Solo lo que sigue abierto
        </button>
      </div>

      {/* La escala de meses y las filas comparten la misma rejilla: el nombre
          fijo a la izquierda y la pista de tiempo ocupando el resto. */}
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="flex items-stretch border-b border-border/60 pb-1.5 mb-2">
            <div className="w-[220px] shrink-0" />
            <div className="relative flex-1 flex">
              {escala.meses.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 text-micro text-mutedSoft capitalize border-l border-border/40 pl-1.5 truncate"
                >
                  {MES(m)}
                  {(i === 0 || m.getMonth() === 0) && <span className="text-mutedSoft/60"> {String(m.getFullYear()).slice(2)}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Hoy, de arriba abajo: es la referencia que da sentido al resto. */}
            {hoyPct >= 0 && hoyPct <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-danger/50 z-10 pointer-events-none"
                style={{ left: `calc(220px + (100% - 220px) * ${hoyPct / 100})` }}
              />
            )}

            {grupos.map(([cliente, items]) => (
              <div key={cliente} className="mb-5 last:mb-0">
                <p className="text-micro uppercase tracking-wide text-mutedSoft mb-1.5">{cliente}</p>
                <div className="space-y-1">
                  {items.map((p) => {
                    const izq = Math.max(0, pct(p.start));
                    const der = Math.min(100, pct(p.due));
                    const cerrado = p.due < hoy;
                    return (
                      <div key={p.id} className="flex items-center group">
                        <Link
                          href={`/sprint/${p.id}`}
                          className="w-[220px] shrink-0 pr-3 text-small text-ink truncate hover:underline"
                          title={`${p.name} · ${dm(p.start)} – ${dm(p.due)}`}
                        >
                          {p.name}
                        </Link>
                        <div className="relative flex-1 h-7">
                          {escala.meses.map((_, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-l border-border/25" style={{ left: `${(i / escala.meses.length) * 100}%` }} />
                          ))}
                          <div
                            className="absolute top-1 bottom-1 rounded-md flex items-center px-2 transition group-hover:brightness-[0.97]"
                            style={{
                              left: `${izq}%`,
                              width: `${Math.max(1.2, der - izq)}%`,
                              background: p.color?.bg,
                              color: p.color?.fg,
                              opacity: cerrado ? 0.45 : 1,
                            }}
                            title={`${dm(p.start)} – ${dm(p.due)}`}
                          >
                            <span className="text-[11px] leading-none truncate">
                              {Math.round((p.due - p.start) / DAY)} d
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
