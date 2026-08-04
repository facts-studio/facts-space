import Link from "next/link";

// Aviso (solo admin) cuando hay tareas asignadas a alguien en un día en que esa
// persona está de vacaciones/ausencia aprobada. Cabecera + una tarjeta por
// conflicto. conflicts: [{ taskId, taskName, url, person, date }]
function fmt(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function ConflictoVacacionesReminder({ conflicts = [] }) {
  if (!conflicts.length) return null;

  const n = conflicts.length;
  const people = [...new Set(conflicts.map((c) => c.person))];
  const resumen = n === 1 ? "1 tarea coincide con una ausencia" : `${n} tareas coinciden con ausencias`;

  return (
    <div className="rounded-2xl bg-warnSoft/30 p-2.5">
      {/* Cabecera */}
      <div className="flex items-center gap-2 px-1.5 pb-2">
        <span className="shrink-0 grid place-items-center h-5 w-5 rounded-full bg-warn/15 text-warn">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </span>
        <p className="text-small font-medium text-ink">{resumen}</p>
        <span className="text-micro text-warn/80 truncate">· {people.length > 1 ? `${people.length} personas` : people[0]}</span>
        <Link href="/calendario" className="ml-auto text-small text-warn font-medium hover:text-ink transition shrink-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-warn/40">Ver →</Link>
      </div>

      {/* Una tarjeta por conflicto */}
      <div className="space-y-1.5">
        {conflicts.slice(0, 4).map((c) => (
          <div key={`${c.taskId}-${c.person}`} className="flex items-center gap-2.5 rounded-xl bg-bg/70 ring-1 ring-border/50 px-2.5 py-2">
            <span className="h-6 w-6 shrink-0 rounded-full bg-warn/12 text-warn grid place-items-center text-[11px] font-semibold">
              {(c.person || "?")[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              {c.url ? (
                <a href={c.url} target="_blank" rel="noopener noreferrer" title="Abrir en ClickUp" className="block truncate text-small text-ink hover:underline transition rounded outline-none focus-visible:ring-2 focus-visible:ring-warn/40">{c.taskName}</a>
              ) : (
                <span className="block truncate text-small text-ink">{c.taskName}</span>
              )}
              <p className="text-micro text-mutedSoft truncate">{c.person}</p>
            </div>
            <span className="shrink-0 rounded-md bg-warn/10 text-warn text-micro font-medium tabular-nums px-1.5 py-0.5">{fmt(c.date)}</span>
          </div>
        ))}
        {n > 4 && <p className="text-micro text-warn/70 px-2.5 pt-0.5">y {n - 4} más…</p>}
      </div>
    </div>
  );
}
