import { cn } from "@/lib/cn";

/**
 * Estado vacío coherente para listas sin datos. Reemplaza el bloque
 * `rounded-2xl bg-surface2/40 px-4 py-12 text-center …` copiado por ahí.
 */
export default function EmptyState({ children, action, className }) {
  return (
    <div className={cn("rounded-2xl bg-surface2/40 px-4 py-12 text-center", className)}>
      <p className="text-[13px] text-mutedSoft">{children}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
