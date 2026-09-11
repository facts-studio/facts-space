"use client";

import Link from "next/link";
import FctsMark from "@/components/FctsMark";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

// Marco del portal para un colaborador. No hay navegación que dar —su portal
// es una sola pantalla— así que la barra lateral sobra: quedan el logo, el
// tema y el cerrar sesión, flotando sobre el contenido.
export default function ColabChrome({ serverTheme = null }) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <Link
        href="/"
        aria-label="F*cts Studio"
        className="fixed top-6 left-6 md:left-10 z-40 flex items-center gap-2.5 group"
      >
        <FctsMark className="h-5 w-auto text-brand shrink-0" />
        <span className="font-display text-[17px] leading-none text-ink hidden sm:block">F*cts Studio</span>
      </Link>

      {/* Mismo lenguaje que la barra de móvil: pastilla despegada del borde,
          translúcida y con blur, para que flote sin tapar del todo. */}
      <div className="fixed top-5 right-5 md:right-10 z-40 flex items-center gap-1 p-1 rounded-full bg-surface/85 backdrop-blur-xl shadow-float">
        <ThemeToggle serverTheme={serverTheme} />
        <button
          type="button"
          onClick={signOut}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="h-8 w-8 grid place-items-center rounded-full text-mutedSoft hover:text-ink hover:bg-surface2/70 transition"
        >
          {/* Logout de MynaUI (mynaui.com/icons) */}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3.25c-3.983 0-5.974 0-7.21 1.164C3.553 5.577 3.553 7.451 3.553 11.2v1.6c0 3.749 0 5.623 1.237 6.786C6.026 20.75 8.017 20.75 12 20.75" />
            <path d="M20.5 12H9.5m11 0-3-3m3 3-3 3" />
          </svg>
        </button>
      </div>
    </>
  );
}
