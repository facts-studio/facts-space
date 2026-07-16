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

// Píldora de presencia: foto de la persona + icono (vacaciones/cumple). Al pasar
// el ratón, una burbuja con el detalle ("vuelve en X días", "cumple hoy").
function PresencePill({ p }) {
  return (
    <span className="group/pr relative inline-flex items-center gap-1.5 h-9 pl-1 pr-2.5 rounded-full bg-surface2/60 border border-border/70">
      {p.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photo} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-border" />
      ) : (
        <span className="w-7 h-7 rounded-full bg-surface2 grid place-items-center text-[13px]">{(p.name || "?")[0]}</span>
      )}
      <span className="text-[13px] leading-none">{p.icon}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-full bg-surface2 border border-border/70 px-2.5 py-1 text-[12px] text-ink opacity-0 transition-opacity group-hover/pr:opacity-100 z-30">
        {p.hint}
      </span>
    </span>
  );
}

export default function QuickLinks({ mode = "inicio", onSelect, presence = [], className = "" }) {
  const toggle = (m) => onSelect?.(mode === m ? "inicio" : m);
  return (
    <nav aria-label="Accesos directos" className={cn("flex flex-wrap items-center gap-2", className)}>
      <Pill active={mode === "notas"} onClick={() => toggle("notas")} icon="note">Notas</Pill>
      <Pill active={mode === "status"} onClick={() => toggle("status")} icon="eye">Status</Pill>

      {presence.length > 0 && <span className="w-px h-6 bg-border/70 mx-1 shrink-0" />}
      {presence.map((p) => <PresencePill key={p.key} p={p} />)}
    </nav>
  );
}
