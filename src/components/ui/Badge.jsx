import { cn } from "@/lib/cn";

/**
 * Píldora de estado semántica. ÚNICA fuente de verdad para los colores de
 * estado: no volver a escribir `bg-warnSoft/60 text-warn` a mano.
 *
 * kind: pending | validated | success | festivo | vacaciones | cumple |
 *       permiso | baja | info | danger | neutral | ink
 */
export const BADGE_KINDS = {
  pending: "bg-warnSoft/60 text-warn",
  validated: "bg-successSoft/60 text-success",
  success: "bg-successSoft/60 text-success",
  festivo: "bg-successSoft/60 text-success",
  vacaciones: "bg-warnSoft/60 text-warn",
  permiso: "bg-infoSoft/60 text-info",
  baja: "bg-violetSoft/60 text-violet",
  cumple: "bg-infoSoft/60 text-info",
  info: "bg-infoSoft/60 text-info",
  danger: "bg-dangerSoft/60 text-danger",
  neutral: "bg-surface2 text-muted",
  // Aviso fuerte: negro relleno. Para lo que reclama una acción concreta
  // (un ticket sin dueño), donde un tono suave se pierde entre los demás.
  ink: "bg-ink text-bg",
};

export default function Badge({ kind = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium",
        BADGE_KINDS[kind] ?? BADGE_KINDS.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
