import NavIcon from "@/components/NavIcon";
import { cn } from "@/lib/cn";

// Accesos directos de la home. Ambos son conmutadores del bloque inferior:
//   Notas  → sustituye todo el bloque por el bloc personal.
//   Status → mantiene "Lo más cercano" y cambia "Tus tareas" por las del equipo.
const PILL = "group inline-flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full border text-small transition";
const IDLE = "bg-surface2/60 border-border/70 text-inkSoft hover:text-ink hover:bg-surface2 hover:border-borderStrong";
const ACTIVE = "bg-ink border-ink text-bg";

function Pill({ active, onClick, icon, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn(PILL, active ? ACTIVE : IDLE)}>
      <span className={cn("transition-colors", active ? "text-bg" : "text-mutedSoft group-hover:text-ink")}>
        <NavIcon name={icon} className="w-[16px] h-[16px]" />
      </span>
      {children}
    </button>
  );
}

export default function QuickLinks({ mode = "inicio", onSelect, className = "" }) {
  const toggle = (m) => onSelect?.(mode === m ? "inicio" : m);
  return (
    <nav aria-label="Accesos directos" className={cn("flex flex-wrap gap-2", className)}>
      <Pill active={mode === "notas"} onClick={() => toggle("notas")} icon="note">Notas</Pill>
      <Pill active={mode === "status"} onClick={() => toggle("status")} icon="eye">Status</Pill>
    </nav>
  );
}
