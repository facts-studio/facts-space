import Link from "next/link";
import NavIcon from "@/components/NavIcon";
import { cn } from "@/lib/cn";

// Accesos directos de la home. "Notas" es un conmutador (alterna el bloque de
// abajo entre Inicio y Notas); "Status" sí navega a Tareas en modo status.
const PILL = "group inline-flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full border text-small transition";
const IDLE = "bg-surface2/60 border-border/70 text-inkSoft hover:text-ink hover:bg-surface2 hover:border-borderStrong";
const ACTIVE = "bg-ink border-ink text-bg";

export default function QuickLinks({ notasActive = false, onToggleNotas, className = "" }) {
  return (
    <nav aria-label="Accesos directos" className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={onToggleNotas}
        aria-pressed={notasActive}
        className={cn(PILL, notasActive ? ACTIVE : IDLE)}
      >
        <span className={cn("transition-colors", notasActive ? "text-bg" : "text-mutedSoft group-hover:text-ink")}>
          <NavIcon name="note" className="w-[16px] h-[16px]" />
        </span>
        Notas
      </button>

      <Link href="/tareas?status=1" className={cn(PILL, IDLE)}>
        <span className="text-mutedSoft group-hover:text-ink transition-colors">
          <NavIcon name="eye" className="w-[16px] h-[16px]" />
        </span>
        Status
      </Link>
    </nav>
  );
}
