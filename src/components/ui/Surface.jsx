import { cn } from "@/lib/cn";

/**
 * Contenedor base del sistema. Es LA superficie del portal: crema suave,
 * rounded-2xl, sin bordes duros. No usar `bg-surface/55 rounded-2xl p-6` suelto
 * por ahí — usar <Surface> (o <Card>).
 *
 * variant:
 *  - "soft"   → bg-surface/55  (contenedor de sección, por defecto)
 *  - "muted"  → bg-surface2/40 (fila / sub-superficie hundida)
 *  - "raised" → bg-surface2/65 con hairline (destacado, p. ej. "lo más cercano")
 *  - "dashed" → contorno punteado (placeholder / drop zone)
 * pad: "none" | "sm" | "md" | "lg"  (md por defecto)
 */
const VARIANTS = {
  soft: "bg-surface/55",
  muted: "bg-surface2/40",
  raised: "bg-surface/75",
  dashed: "bg-transparent border border-dashed border-borderStrong",
};
const PADS = { none: "", sm: "p-4", md: "p-6", lg: "p-7 md:p-10" };

export default function Surface({
  as: Tag = "div",
  variant = "soft",
  pad = "md",
  hover = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl",
        VARIANTS[variant],
        PADS[pad],
        hover && "transition hover:bg-surface2/70",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
