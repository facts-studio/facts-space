"use client";

import Link from "next/link";
import FctsMark from "@/components/FctsMark";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

// Raíl de un colaborador: los sitios del Sidebar recogido —logo arriba, tema y
// cerrar sesión abajo— pero flotando. Sin barra no hay navegación que dar (su
// portal es una sola pantalla), así que tampoco tiene sentido que un mueble
// vacío se quede con 76px de ancho ni que una línea divida nada.
function LogoutButton({ className = "" }) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  return (
    <button
      type="button"
      onClick={signOut}
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
      className={`h-9 w-9 grid place-items-center rounded-lg text-mutedSoft hover:text-ink hover:bg-surface2/60 transition ${className}`}
    >
      {/* Logout de MynaUI (mynaui.com/icons) */}
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3.25c-3.983 0-5.974 0-7.21 1.164C3.553 5.577 3.553 7.451 3.553 11.2v1.6c0 3.749 0 5.623 1.237 6.786C6.026 20.75 8.017 20.75 12 20.75" />
        <path d="M20.5 12H9.5m11 0-3-3m3 3-3 3" />
      </svg>
    </button>
  );
}

export default function ColabChrome({ serverTheme = null }) {
  return (
    <>
      {/* fixed, no sticky: no entra en el flujo, así que el contenido usa todo
          el ancho. Alineado a la misma columna que el Sidebar recogido. */}
      <div className="fixed left-0 top-0 z-30 hidden md:flex flex-col items-center w-[76px] h-screen px-3 py-6 pointer-events-none">
        <Link
          href="/"
          aria-label="F*cts Studio"
          className="pointer-events-auto h-9 w-9 grid place-items-center rounded-lg hover:bg-surface2/60 transition"
        >
          <FctsMark className="h-5 w-auto text-brand" />
        </Link>

        <div className="mt-auto pointer-events-auto flex flex-col items-center gap-2">
          <ThemeToggle serverTheme={serverTheme} vertical />
          <LogoutButton />
        </div>
      </div>

      {/* En móvil el raíl no cabe: el mismo par, en horizontal, arriba. */}
      <div className="md:hidden fixed top-4 right-4 z-40 flex items-center gap-1">
        <ThemeToggle serverTheme={serverTheme} />
        <LogoutButton />
      </div>
    </>
  );
}
