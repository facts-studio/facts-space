"use client";

import { useEffect, useState } from "react";
import Confetti from "@/components/Confetti";

// `people` son los nombres de quien cumple HOY, calculado en el servidor a
// partir de los eventos reales del calendario (cumpleaños de ClickUp vinculados
// a un empleado ACTIVO). Así el confeti respeta bajas y vínculos, y nunca
// felicita a gente que ya no está.
export default function BirthdayConfetti({ people = [] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!people.length) return;
    // En rAF, no en el cuerpo del efecto: evita el render en cascada (y la
    // regla react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => setShow(false), 8000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [people.length]);

  if (!show || !people.length) return null;

  return (
    <>
      <Confetti />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[61] fade-up">
        <div className="flex items-center gap-3 bg-paper shadow-float rounded-full pl-4 pr-2 py-2">
          <span className="text-[18px]">🎂</span>
          <span className="text-small text-ink">
            ¡Feliz cumpleaños, <span className="font-semibold">{people.join(" y ")}</span>!
          </span>
          <button onClick={() => setShow(false)} aria-label="Cerrar" className="h-6 w-6 inline-flex items-center justify-center rounded-full text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
