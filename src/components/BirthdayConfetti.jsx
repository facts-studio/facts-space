"use client";

import { useEffect, useState } from "react";
import { TEAM } from "@/lib/mock";
import Confetti from "@/components/Confetti";

export default function BirthdayConfetti() {
  const [people, setPeople] = useState([]);
  const [show, setShow] = useState(false);

  // Genera el confeti en cliente (evita mismatch de hidratación con Math.random).
  useEffect(() => {
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const matches = TEAM.filter((m) => (m.birthday || "").slice(5) === md);
    if (!matches.length) return;

    // En rAF, no en el cuerpo del efecto: evita el render en cascada (y la
    // regla react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => { setPeople(matches.map((m) => m.name)); setShow(true); });
    const t = setTimeout(() => setShow(false), 8000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);

  if (!show) return null;

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
