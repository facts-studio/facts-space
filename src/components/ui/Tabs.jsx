import { cn } from "@/lib/cn";

/**
 * Conmutador de pestañas segmentado. Reemplaza el grupo de botones que cada
 * pantalla reimplementaba a mano con `bg-bg text-ink shadow-sm`.
 *
 * tabs: [{ value, label }]  |  value  |  onChange(value)
 */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn("inline-flex items-center bg-surface2/60 rounded-lg p-0.5", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "px-3 py-1 rounded-md text-[12.5px] transition",
              active ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
