import Link from "next/link";
import { Surface, SectionHeader, Badge, ProgressBar, EmptyState } from "@/components/ui";

// Verde de "hecho" (token success), mismo tratamiento que las barras de fichaje.
const PROGRESO_VERDE = {
  bg: "rgb(var(--ct-success) / 0.20)",
  stripe: "rgb(var(--ct-success) / 0.42)",
};

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

// Burbuja de info: la definición del sprint (campo "content" de la lista en
// ClickUp) al pasar el ratón. Solo CSS — el bloque es server component.
function InfoBubble({ text }) {
  return (
    <span className="group/info relative shrink-0 leading-none">
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" aria-hidden
        className="text-mutedSoft transition-colors group-hover/info:text-ink"
      >
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 11v5.5M12 7.6v.6" />
      </svg>
      <span className="pointer-events-none absolute right-0 top-full mt-2 z-50 w-[280px] rounded-2xl bg-surface border border-border/40 px-4 py-3 text-left opacity-0 translate-y-1 transition-[opacity,transform] duration-150 group-hover/info:opacity-100 group-hover/info:translate-y-0 shadow-float">
        <span className="block text-[12.5px] leading-relaxed text-muted whitespace-normal">{text}</span>
      </span>
    </span>
  );
}

function SprintCard({ s }) {
  const p = plazo(s);
  const pct = Math.round(s.pct);
  const fechas = rango(s);

  return (
    // Lleva a Tareas ya filtrado por este sprint (?sprint=… lo resuelve
    // tareas-client contra las tareas para componer su clave interna).
    <Surface
      as={Link}
      // Los sprints tienen agrupación propia en Tareas; los proyectos temporales
      // no (viven dentro de su cliente), así que esos se filtran por su lista.
      href={
        s.kind === "sprint"
          ? `/tareas?sprint=${encodeURIComponent(s.name)}`
          : `/tareas?list=${encodeURIComponent(s.name)}`
      }
      variant="muted"
      pad="sm"
      hover
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-[14px] font-medium text-ink leading-snug truncate">{s.name}</p>
        {s.note && <InfoBubble text={s.note} />}
      </div>

      {/* Progreso: verde de "hecho" (token success) con rayas diagonales,
          el mismo tratamiento que las barras de fichaje. */}
      <div className="flex items-center gap-3">
        <ProgressBar
          value={pct}
          tint={PROGRESO_VERDE}
          className="flex-1"
          label={`Progreso de ${s.name}: ${pct}%`}
        />
        <span className="shrink-0 text-micro text-mutedSoft tabular-nums w-9 text-right">{pct}%</span>
      </div>

      {/* Tareas a la izquierda y la fecha en un tag a la derecha. El plazo solo
          si aprieta o ya se pasó; si no, es repetir la fecha de fin. */}
      {/* flex-wrap y sin truncate: en columna estrecha la meta baja de línea
          antes que cortarse (se comía el "N vencidas"). */}
      <div className="flex items-center justify-between gap-x-2 gap-y-1 flex-wrap">
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
        <div className="flex items-center gap-1.5 shrink-0">
          {s.client && <Badge kind="neutral">{s.client}</Badge>}
          {fechas && <Badge kind="neutral">{fechas}</Badge>}
        </div>
      </div>
    </Surface>
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
      <SectionHeader label="Sprints activos" />
      {sprints.length === 0 ? (
        <EmptyState>No hay sprints ni proyectos temporales activos.</EmptyState>
      ) : (
        // Radios concéntricos: el exterior = radio interior + separación. Las
        // pastillas son rounded-2xl (20px) y el aire 12px (p-3 / gap-3), así que
        // el contenedor va a rounded-4xl (32px). 20 + 12 = 32. Los `!` hacen
        // falta porque `cn` no resuelve conflictos de Tailwind.
        <Surface pad="none" className="p-3 !rounded-4xl">
          <div className="grid gap-3 sm:grid-cols-2">
            {sprints.map((s) => (
              <SprintCard key={s.id} s={s} />
            ))}
          </div>
        </Surface>
      )}
    </section>
  );
}
