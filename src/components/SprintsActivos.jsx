import { Surface, SectionHeader, Badge, ProgressBar, EmptyState } from "@/components/ui";
import { paletteColor } from "@/lib/client-palette";

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
  // Color del cliente: el elegido en admin o, si no, determinista por el nombre.
  const tint = paletteColor(s.client || s.name, s.colorKey);

  return (
    <div className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
      {/* Título + tareas, y la fecha en un tag al extremo derecho. El plazo solo
          si aprieta o ya se pasó; si no, es repetir la fecha de fin. */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-[14px] text-ink leading-snug truncate min-w-0">
          {s.client && <span className="text-mutedSoft">{s.client} · </span>}
          <span className="font-medium">{s.name}</span>
        </p>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-micro text-mutedSoft">
            {s.active > 0 && `${s.active} activa${s.active === 1 ? "" : "s"}`}
            {p && p.urge && (
              <span className={p.kind === "danger" ? "text-danger" : undefined}>
                {s.active > 0 && " · "}
                {p.text}
              </span>
            )}
            {s.overdue > 0 && (
              <span className="text-danger">
                {" · "}
                {s.overdue} vencida{s.overdue === 1 ? "" : "s"}
              </span>
            )}
          </span>
          {fechas && <Badge kind="neutral">{fechas}</Badge>}
        </div>
      </div>

      {/* Progreso: relleno con el color del cliente y rayas diagonales. */}
      <div className="flex items-center gap-3">
        <ProgressBar
          value={pct}
          tint={tint}
          className="flex-1"
          label={`Progreso de ${s.name}: ${pct}%`}
        />
        <span className="shrink-0 text-micro text-mutedSoft tabular-nums w-9 text-right">{pct}%</span>
      </div>
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
