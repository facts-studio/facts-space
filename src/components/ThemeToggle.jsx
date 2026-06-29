"use client";

import { useEffect, useState } from "react";

// Switch claro/oscuro. Manual (persiste en localStorage) y, si no hay
// preferencia guardada, sigue la del sistema en vivo.
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    // Si el usuario no ha elegido manualmente, seguir el sistema.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      if (!localStorage.getItem("theme")) {
        document.documentElement.classList.toggle("dark", e.matches);
        setDark(e.matches);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label="Cambiar tema"
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="group inline-flex items-center gap-1 p-1 rounded-full bg-surface2/70 border border-border hover:border-borderStrong transition w-[58px]"
    >
      <span className={`flex items-center justify-center h-6 w-6 rounded-full transition ${!dark ? "bg-paper shadow-card text-ink" : "text-mutedSoft"}`}>
        {/* sol */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span className={`flex items-center justify-center h-6 w-6 rounded-full transition ${dark ? "bg-paper shadow-card text-ink" : "text-mutedSoft"}`}>
        {/* luna */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </span>
    </button>
  );
}
