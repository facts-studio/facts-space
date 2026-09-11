"use client";

import Link from "next/link";
import FctsMark from "@/components/FctsMark";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

// Barra lateral para un colaborador: la misma de siempre en su versión
// recogida, pero sin navegación —su portal es una sola pantalla, así que una
// lista de un solo destino sería un mueble vacío—. Quedan el logo arriba y el
// tema y el cerrar sesión abajo.
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
      {/* Mismas medidas y borde que el Sidebar recogido (w-76 / px-3 / py-6). */}
      <aside className="shrink-0 h-screen sticky top-0 z-30 hidden md:flex flex-col items-center w-[76px] px-3 py-6 border-r border-border">
        <Link href="/" aria-label="F*cts Studio" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-surface2/60 transition">
          <FctsMark className="h-5 w-auto text-brand" />
        </Link>

        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle serverTheme={serverTheme} />
          <LogoutButton />
        </div>
      </aside>

      {/* En móvil no hay barra lateral: el mismo par, flotando arriba. */}
      <div className="md:hidden fixed top-4 right-4 z-40 flex items-center gap-1 p-1 rounded-full bg-surface/85 backdrop-blur-xl shadow-float">
        <ThemeToggle serverTheme={serverTheme} />
        <LogoutButton />
      </div>
    </>
  );
}
