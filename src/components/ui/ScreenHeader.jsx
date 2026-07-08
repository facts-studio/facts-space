import { cn } from "@/lib/cn";

/**
 * Barra superior de pantalla — patrón heredado del panel Adhōc: fina, sticky,
 * con breadcrumb (KICKER / Título) a la izquierda y acciones a la derecha.
 * Sustituye a los títulos serif grandes: más limpio y denso.
 *
 * Se sangra a los bordes del área de contenido con -mx para que la línea y el
 * blur lleguen de lado a lado; encaja con el padding del layout del portal
 * (px-5 md:px-10).
 */
export default function ScreenHeader({ kicker, title, actions, className }) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-5 md:-mx-10 px-5 md:px-10 mb-6",
        "bg-bg/85 backdrop-blur-md border-b border-border/50",
        className
      )}
    >
      <div className="h-12 flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0 text-[12.5px]">
          {kicker && <span className="uppercase tracking-[0.08em] text-mutedSoft truncate">{kicker}</span>}
          {kicker && title && <span className="text-mutedSoft/70 shrink-0">/</span>}
          {title && <span className="text-ink font-medium truncate">{title}</span>}
        </div>
        {actions && <div className="ml-auto flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
