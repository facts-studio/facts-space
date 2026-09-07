"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { teamPhoto } from "@/components/tasks/task-atoms";

// Filtro "de quién". Es UNA función con dos permisos: el admin elige a
// cualquiera del equipo; el resto solo puede acotar a lo suyo. Por eso los dos
// controles comparten forma (píldora con avatar) y solo cambia el gesto.

function Avatar({ email, name, size = 28 }) {
  const foto = teamPhoto(email);
  const box = { width: size, height: size };
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt="" style={box} width={size} height={size} className="rounded-full object-cover shrink-0 block" />;
  }
  return (
    <span style={box} className="shrink-0 rounded-full grid place-items-center bg-surface2 text-[11px] text-muted">
      {(name || email || "?")[0]?.toUpperCase()}
    </span>
  );
}

// Avatares apilados: la forma de decir "todo el equipo" sin escribirlo.
function Stack({ members, size = 28 }) {
  const tres = members.slice(0, 3);
  return (
    // `shrink-0` en cada burbuja: dentro de un flex se aplastaban al no tener
    // ancho propio que defender.
    <span className="inline-flex items-center shrink-0">
      {tres.map((m, i) => (
        <span
          key={m.email ?? m.name}
          className="shrink-0 rounded-full ring-2 ring-surface"
          style={{ marginLeft: i ? -Math.round(size * 0.38) : 0, zIndex: tres.length - i }}
        >
          <Avatar email={m.email} name={m.name} size={size} />
        </span>
      ))}
    </span>
  );
}

export default function PersonFilter({
  isAdmin = false,
  members = [],          // [{ email, name, count }]
  value = "",            // email seleccionado ("" = todo el equipo)
  onChange,
  myEmail = null,
  mine = false,          // no-admin: ¿solo lo mío?
  onToggleMine,
  className,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const pill = "inline-flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border transition text-[13px] shrink-0";

  // Sin permisos de admin: solo el interruptor de "lo mío".
  if (!isAdmin) {
    return (
      <button
        type="button"
        onClick={onToggleMine}
        title="Ver solo mis tareas"
        aria-pressed={mine}
        className={cn(
          pill,
          mine ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface text-ink hover:border-borderStrong",
          className
        )}
      >
        <Avatar email={myEmail} name={myEmail} />
        Mis tareas
      </button>
    );
  }

  const sel = members.find((m) => m.email === value) || null;

  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          pill,
          "bg-surface text-ink",
          open ? "border-borderStrong" : "border-border hover:border-borderStrong"
        )}
      >
        {sel ? <Avatar email={sel.email} name={sel.name} /> : <Stack members={members} />}
        <span className="truncate max-w-[120px]">{sel ? sel.name : "Todo el equipo"}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("text-mutedSoft transition-transform", open && "rotate-180")}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[220px] max-h-[320px] overflow-y-auto rounded-xl bg-paper border border-border shadow-float p-1">
          <Row selected={!value} onClick={() => { onChange?.(""); setOpen(false); }}>
            <Stack members={members} size={22} />
            <span className="flex-1 truncate">Todo el equipo</span>
          </Row>
          {members.map((m) => (
            <Row key={m.email ?? m.name} selected={value === m.email} onClick={() => { onChange?.(m.email); setOpen(false); }}>
              <Avatar email={m.email} name={m.name} size={22} />
              <span className="flex-1 truncate">{m.name}</span>
              {m.count != null && <span className="text-micro text-mutedSoft tabular-nums">{m.count}</span>}
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-small text-left transition",
        selected ? "bg-surface2/70 text-ink" : "text-inkSoft hover:bg-surface2/50 hover:text-ink"
      )}
    >
      {children}
      {selected && <span className="text-ink text-[11px]">✓</span>}
    </button>
  );
}
