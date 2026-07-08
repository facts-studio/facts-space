import { cn } from "@/lib/cn";

/**
 * Campo de formulario del sistema: etiqueta micro + control. Unifica los
 * wrappers `Labeled` / `Fld` / `Field` repetidos por las pantallas.
 *
 * Uso:
 *   <Field label="Día"><Input type="date" … /></Field>
 */
export function Field({ label, hint, className, children }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-micro text-mutedSoft">{label}</span>}
      {children}
      {hint && <span className="text-micro text-mutedSoft/80 leading-snug">{hint}</span>}
    </label>
  );
}

// Control base compartido por input / select. Radios y paddings unificados
// (rounded-lg, h-9) para acabar con la mezcla rounded-lg vs rounded-[10px].
export const controlCls =
  "h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-brand/55 focus:ring-2 focus:ring-brand/15 disabled:opacity-50";

export function Input({ className, ...props }) {
  return <input className={cn(controlCls, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(controlCls, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}
