import { SectionHeader, ProgressBar, EmptyState } from "@/components/ui";

// "8 sep" — mismo formato corto que usa el modo Status.
const dm = (ts) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");

function rango(s) {
  if (s.start && s.due) return `${dm(s.start)} – ${dm(s.due)}`;
  if (s.due) return `hasta el ${dm(s.due)}`;
  if (s.start) return `desde el ${dm(s.start)}`;
  return null;
}

// Cuánto queda, en lenguaje natural. Es lo que de verdad se mira de un sprint.
function plazo(s) {
  if (s.daysLeft == null) return null;
  if (s.daysLeft < 0) return { text: `${Math.abs(s.daysLeft)} d de retraso`, late: true };
  if (s.daysLeft === 0) return { text: "acaba hoy", late: false };
  if (s.daysLeft === 1) return { text: "queda 1 día", late: false };
  return { text: `quedan ${s.daysLeft} días`, late: false };
}

function SprintRow({ s }) {
  const p = plazo(s);
  const pct = Math.round(s.pct);
  // Meta en una sola línea de texto menor: fechas · tareas · plazo.
  const meta = [rango(s), s.total > 0 ? `${s.active} activa${s.active === 1 ? "" : "s"} de ${s.total}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] text-ink leading-snug truncate">
          {s.client && <span className="text-mutedSoft">{s.client} · </span>}
          <span className="font-medium">{s.name}</span>
        </p>
        <span className="shrink-0 text-micro text-mutedSoft tabular-nums">{pct}%</span>
      </div>

      <ProgressBar
        value={pct}
        tone={s.pastDue ? "danger" : "ink"}
        className="mt-2"
        label={`Progreso de ${s.name}: ${pct}%`}
      />

      <p className="mt-1.5 text-micro text-mutedSoft">
        {meta}
        {p && (
          <>
            {meta && " · "}
            <span className={p.late ? "text-danger" : undefined}>{p.text}</span>
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Bloque de Inicio: sprints y proyectos temporales EN CURSO, uno debajo de otro,
 * con fechas, tareas activas y barra de progreso. Datos de `activeSprints()`
 * (src/lib/data/clickup.js).
 */
export default function SprintsActivos({ sprints = [], className = "" }) {
  return (
    <section className={className}>
      <SectionHeader label="En curso" />
      {sprints.length === 0 ? (
        <EmptyState>No hay sprints ni proyectos temporales activos.</EmptyState>
      ) : (
        <div className="divide-y divide-border/50">
          {sprints.map((s) => (
            <SprintRow key={s.id} s={s} />
          ))}
        </div>
      )}
    </section>
  );
}
