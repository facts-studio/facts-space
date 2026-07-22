"use client";

import { useEffect, useState } from "react";

const COLORS = ["#2F6B49", "#C44A3F", "#386E9E", "#B07A1F", "#8A5CB0", "#3F7A3A", "#E0C770"];

const makePieces = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    dur: 2.8 + Math.random() * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: 5 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    rot: Math.random() * 360,
  }));

/**
 * Lluvia de confeti a pantalla completa. Se genera en cliente (Math.random no
 * puede correr en SSR sin romper la hidratación) y se limpia sola.
 * Se usa en el cumpleaños y al abrir la app con una ausencia recién aprobada.
 */
export default function Confetti({ count = 110, duration = 8000 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // En rAF, fuera del render de hidratación.
    const raf = requestAnimationFrame(() => setPieces(makePieces(count)));
    const t = setTimeout(() => setPieces([]), duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [count, duration]);

  if (!pieces.length) return null;

  return (
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
  );
}
