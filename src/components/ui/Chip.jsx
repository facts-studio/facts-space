import { cn } from "@/lib/cn";

/**
 * Chip de filtro (toggle redondeado). Es el estilo de filtro del portal
 * (calendario, tareas…). Activo = ink relleno; inactivo = contorno suave.
 * `dot` pinta un punto de color a la izquierda (para filtros por tipo/color).
 */
export default function Chip({ active = false, dot, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] border transition active:scale-[0.97] whitespace-nowrap",
        active
          ? "bg-ink text-bg border-ink"
          : "bg-transparent text-muted border-border hover:text-ink hover:border-borderStrong",
        className
      )}
    >
      {dot && <span className="inline-block w-2 h-2 rounded-full" style={{ background: active ? "currentColor" : dot }} />}
      {children}
    </button>
  );
}
