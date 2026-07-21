import { Surface, SectionHeader, Badge, ProgressBar, EmptyState } from "@/components/ui";

// "8 sep" — mismo formato corto que usa el modo Status.
const dm = (ts) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");

function rango(s) {
  if (s.start && s.due) return `${dm(s.start)} – ${dm(s.due)}`;
  if (s.due) return `hasta el ${dm(s.due)}`;
  if (s.start) return `desde el ${dm(s.start)}`;
  return null;
}

// Cuánto queda. `urge` marca lo que merece decirse aparte: si faltan semanas,
// la fecha de fin ya lo dice y repetirlo solo añade ruido.
function plazo(s) {
  if (s.daysLeft == null) return null;
  if (s.daysLeft < 0) return { text: `${Math.abs(s.daysLeft)} d de retraso`, kind: "danger", urge: true };
  if (s.daysLeft === 0) return { text: "acaba hoy", kind: "pending", urge: true };
  if (s.daysLeft === 1) return { text: "queda 1 día", kind: "pending", urge: true };
  return { text: `quedan ${s.daysLeft} días`, kind: "neutral", urge: s.daysLeft <= 3 };
}

function SprintRow({ s }) {
  const p = plazo(s);
  const pct = Math.round(s.pct);
  const fechas = rango(s);

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      {/* Título + tipo */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] text-ink leading-snug truncate">
          {s.client && <span className="text-mutedSoft">{s.client} · </span>}
          <span className="font-medium">{s.name}</span>
        </p>
        <Badge kind={s.kind === "sprint" ? "info" : "neutral"} className="shrink-0">
          {s.kind === "sprint" ? "✦ Sprint" : "Temporal"}
        </Badge>
      </div>

      {/* Progreso */}
      <div className="flex items-center gap-3">
        <ProgressBar
          value={pct}
          tone={s.pastDue ? "danger" : "ink"}
          className="flex-1"
          label={`Progreso de ${s.name}: ${pct}%`}
        />
        <span className="shrink-0 text-micro text-mutedSoft tabular-nums w-9 text-right">{pct}%</span>
      </div>

      {/* Meta mínima: fechas + tareas activas. El plazo solo si aprieta o ya
          se pasó (si no, es repetir la fecha de fin), y las vencidas en rojo. */}
      <p className="text-micro text-mutedSoft">
        {[fechas, s.active > 0 ? `${s.active} activa${s.active === 1 ? "" : "s"}` : null]
          .filter(Boolean)
          .join(" · ")}
        {p && p.urge && (
          <span className={p.kind === "danger" ? "text-danger" : undefined}>
            {" · "}
            {p.text}
          </span>
        )}
        {s.overdue > 0 && (
          <span className="text-danger">
            {" · "}
            {s.overdue} vencida{s.overdue === 1 ? "" : "s"}
          </span>
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
        <Surface className="divide-y divide-border/50">
          {sprints.map((s) => (
            <SprintRow key={s.id} s={s} />
          ))}
        </Surface>
      )}
    </section>
  );
}
