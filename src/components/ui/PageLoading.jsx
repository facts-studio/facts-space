import { cn } from "@/lib/cn";

// Barra de skeleton reutilizable (bloque gris con pulso). Usa la clase .skeleton.
export function Skeleton({ className, style }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden />;
}

// Cabecera fantasma (título + acción) común a las pantallas.
function HeaderGhost() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-7 w-24 ml-auto" />
    </div>
  );
}

// Fila fantasma tipo lista (avatar + dos líneas + meta).
function RowGhost({ i = 0 }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <Skeleton className="h-9 w-9 !rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5" style={{ width: `${70 - (i % 4) * 12}%` }} />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-3.5 w-16 shrink-0" />
    </div>
  );
}

// ── Variantes por tipo de pantalla ──────────────────────────────────────────

function ListGhost({ rows }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-4 sm:p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => <RowGhost key={i} i={i} />)}
    </div>
  );
}

// Calendario: barra de controles + rejilla de días.
function CalendarGhost() {
  return (
    <div className="rounded-2xl bg-surface/55 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h${i}`} className="h-4 !rounded-md" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square !rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Rejilla de tarjetas (equipo, clientes).
function CardsGhost({ cards = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface/55 p-4 flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 !rounded-full" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// Panel con métricas arriba y una lista debajo (fichaje, admin, mi-espacio).
function DashboardGhost({ stats = 3, rows = 4, tabs = false }) {
  return (
    <div className="space-y-4">
      {tabs && (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface/55 p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <ListGhost rows={rows} />
    </div>
  );
}

/**
 * Estado de carga mínimo para las pantallas del portal (fallback de loading.js).
 * Cambia de forma según la pantalla para que el esqueleto se parezca al contenido.
 *
 * variant: "list" | "calendar" | "cards" | "dashboard"
 */
export default function PageLoading({ variant = "list", rows = 6, header = true, className, ...opts }) {
  const body =
    variant === "calendar" ? <CalendarGhost /> :
    variant === "cards" ? <CardsGhost {...opts} /> :
    variant === "dashboard" ? <DashboardGhost rows={rows} {...opts} /> :
    <ListGhost rows={rows} />;

  return (
    <div className={cn("fade-up", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      {header && <HeaderGhost />}
      {body}
    </div>
  );
}
