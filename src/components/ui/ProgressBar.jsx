import { cn } from "@/lib/cn";

/**
 * Barra de progreso del sistema. ÚNICA fuente de verdad: no volver a escribir
 * `h-1.5 rounded-full bg-surface2 overflow-hidden` + hijo a mano.
 *
 * value/max → porcentaje (se recorta a 0–100). tone define el color del relleno;
 * "ink" (negro) es la acción/progreso por defecto de la paleta.
 * size: "sm" (1.5) | "md" (2)
 */
const TONES = {
  ink: "bg-ink",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
  muted: "bg-mutedSoft",
};
const SIZES = { sm: "h-1.5", md: "h-2" };

export default function ProgressBar({
  value = 0,
  max = 100,
  tone = "ink",
  size = "sm",
  tint,
  label,
  className,
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  // Con `tint` (color de cliente de client-palette) el relleno va en el tinte
  // claro + rayas diagonales en el color legible: pesa mucho menos que un
  // bloque sólido. Mismo patrón que las barras de fichaje.
  const styled = tint
    ? {
        backgroundColor: tint.bg,
        backgroundImage: `repeating-linear-gradient(45deg, ${tint.fg}66 0 3px, transparent 3px 8px)`,
      }
    : null;
  return (
    <div
      className={cn("rounded-full bg-surface2 overflow-hidden", SIZES[size] ?? SIZES.sm, className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          !styled && (TONES[tone] ?? TONES.ink)
        )}
        style={{ width: `${pct}%`, ...styled }}
      />
    </div>
  );
}
