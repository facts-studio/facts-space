import { cn } from "@/lib/cn";

/**
 * Cabecera de sección: eyebrow (kicker en mayúsculas) + acción opcional a la
 * derecha. Reemplaza el patrón repetido
 *   <div className="flex items-center justify-between mb-4">
 *     <p className="section-eyebrow">…</p> …
 *   </div>
 */
export default function SectionHeader({ label, action, className, children }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 flex-wrap mb-4", className)}>
      <p className="section-eyebrow">{label}</p>
      {action ?? children}
    </div>
  );
}
