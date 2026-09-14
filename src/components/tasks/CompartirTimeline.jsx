"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { crearEnlaceTimeline } from "@/lib/actions/share";
import { cn } from "@/lib/cn";

// Crea un enlace público del calendario de proyectos y lo copia. El enlace va
// firmado y caduca a los 30 días; quien lo abra ve los proyectos, sus fechas y
// en qué punto están, y nada más.
//
// Cuando copiar no sale —el navegador puede negar el portapapeles fuera de un
// gesto, o el enlace apuntar a localhost— se enseña en una tarjeta para
// copiarlo a mano. Nada de prompt(): no está soportado aquí.
export default function CompartirTimeline() {
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState(null);
  const [abierto, setAbierto] = useState(null); // { url, local }
  const [pending, start] = useTransition();
  const input = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    input.current?.select();
    const fuera = (e) => { if (!e.target.closest?.("[data-compartir]")) setAbierto(null); };
    const esc = (e) => { if (e.key === "Escape") setAbierto(null); };
    document.addEventListener("mousedown", fuera, true);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera, true);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const compartir = () =>
    start(async () => {
      setError(null);
      const r = await crearEnlaceTimeline(30);
      if (!r.ok) { setError(r.error); setTimeout(() => setError(null), 4000); return; }
      // Sin dominio público el enlace solo abre en esta máquina: se enseña con
      // el aviso en vez de copiarlo en silencio.
      if (r.local) { setAbierto({ url: r.url, local: true }); return; }
      try {
        await navigator.clipboard.writeText(r.url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      } catch {
        setAbierto({ url: r.url, local: false });
      }
    });

  return (
    <span className="relative shrink-0" data-compartir>
      <button
        type="button"
        onClick={compartir}
        disabled={pending}
        title={error || "Copiar un enlace para enseñar este calendario a alguien de fuera. Caduca en 30 días."}
        aria-label="Compartir calendario"
        className={cn(
          "h-8 w-8 grid place-items-center rounded-lg transition disabled:opacity-50",
          copiado ? "text-success" : error ? "text-danger" : "text-mutedSoft hover:text-ink hover:bg-surface2/70"
        )}
      >
        {/* El check confirma sin mover nada de sitio. */}
        {copiado ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          // Share de MynaUI (mynaui.com/icons)
          <svg viewBox="0 0 24 24" className={cn("h-4 w-4", pending && "animate-pulse")} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8.7 10.7 15.3 7.3M8.7 13.3l6.6 3.4" />
            <circle cx="18" cy="6" r="2.75" />
            <circle cx="6" cy="12" r="2.75" />
            <circle cx="18" cy="18" r="2.75" />
          </svg>
        )}
      </button>

      {abierto && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-[340px] rounded-xl bg-paper border border-border shadow-float p-3">
          <p className="text-micro text-mutedSoft mb-2 leading-snug">
            {abierto.local
              ? "Sin dominio público, este enlace solo abre en tu máquina."
              : "Copia el enlace. Caduca en 30 días."}
          </p>
          <input
            ref={input}
            readOnly
            value={abierto.url}
            onFocus={(e) => e.target.select()}
            className="w-full h-8 rounded-lg bg-surface border border-border px-2 text-[12px] text-ink outline-none"
          />
        </div>
      )}
    </span>
  );
}
