"use client";

import { useEffect, useState } from "react";
import { TEAM } from "@/lib/mock";

const COLORS = ["#2F6B49", "#C44A3F", "#386E9E", "#B07A1F", "#8A5CB0", "#3F7A3A", "#E0C770"];

export default function BirthdayConfetti() {
  const [pieces, setPieces] = useState([]);
  const [people, setPeople] = useState([]);
  const [show, setShow] = useState(false);

  // Genera el confeti en cliente (evita mismatch de hidratación con Math.random).
  useEffect(() => {
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const matches = TEAM.filter((m) => (m.birthday || "").slice(5) === md);
    if (!matches.length) return;

    setPeople(matches.map((m) => m.name));
    setPieces(
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.8 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * 360,
      }))
    );
    setShow(true);
    const t = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              width: p.w,
              height: p.h,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        ))}
      </div>

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
