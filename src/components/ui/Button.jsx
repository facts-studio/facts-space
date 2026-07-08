import { cn } from "@/lib/cn";

/**
 * Botón del sistema. Envuelve las clases `.btn-*` de globals.css para que el
 * variant sea una prop y no una string suelta. Para tamaños compactos usa
 * size="sm" (h-8) en avisos/toolbars.
 *
 * variant: primary | brand | ghost | quiet | danger
 * size:    md (por defecto) | sm
 */
const VARIANTS = {
  primary: "btn-primary",
  brand: "btn-brand",
  ghost: "btn-ghost",
  quiet: "btn-quiet",
  danger: "btn-danger",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        VARIANTS[variant] ?? VARIANTS.primary,
        size === "sm" && "h-8 text-[12.5px] px-3",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
