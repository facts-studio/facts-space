import { cn } from "@/lib/cn";

/**
 * Fila clave/valor para listas de datos (ficha, resúmenes, documentos).
 * Envuélvelas en <DataList> para el divisor coherente.
 */
export function DataList({ className, children }) {
  return <div className={cn("divide-y divide-border/50", className)}>{children}</div>;
}

export function DataRow({ label, value, action, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2.5", className)}>
      <dt className="text-small text-mutedSoft">{label}</dt>
      <dd className="text-small text-ink text-right flex items-center gap-2">
        {value ?? "—"}
        {action}
      </dd>
    </div>
  );
}
