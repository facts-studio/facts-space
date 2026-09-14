"use client";

import { useState, useTransition } from "react";
import { crearEnlaceTimeline } from "@/lib/actions/share";
import { cn } from "@/lib/cn";

// Crea un enlace público del calendario de proyectos y lo copia. El enlace va
// firmado y caduca a los 30 días; quien lo abra ve los proyectos, sus fechas y
// en qué punto están, y nada más.
export default function CompartirTimeline() {
  const [estado, setEstado] = useState(null); // null | "copiado" | mensaje de error
  const [pending, start] = useTransition();

  const compartir = () =>
    start(async () => {
      const r = await crearEnlaceTimeline(30);
      if (!r.ok) { setEstado(r.error); return; }
      try {
        await navigator.clipboard.writeText(r.url);
        setEstado("copiado");
      } catch {
        // Sin permiso de portapapeles (Safari fuera de un gesto, http…): que al
        // menos se pueda leer y copiar a mano.
        window.prompt("Copia el enlace:", r.url);
        setEstado(null);
      }
      setTimeout(() => setEstado(null), 2500);
    });

  return (
    <button
      type="button"
      onClick={compartir}
      disabled={pending}
      title={
        estado === "copiado"
          ? "Enlace copiado"
          : estado || "Copiar un enlace para enseñar este calendario a alguien de fuera. Caduca en 30 días."
      }
      aria-label="Compartir calendario"
      className={cn(
        "h-8 w-8 grid place-items-center rounded-lg transition shrink-0 disabled:opacity-50",
        estado === "copiado" ? "text-success" : estado ? "text-danger" : "text-mutedSoft hover:text-ink hover:bg-surface2/70"
      )}
    >
      {/* El check confirma sin mover nada de sitio: la barra no debe saltar
          porque el texto pase de "Compartir" a "Enlace copiado". */}
      {estado === "copiado" ? (
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
  );
}
