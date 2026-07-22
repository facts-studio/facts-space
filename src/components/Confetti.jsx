"use client";

import { useEffect, useState } from "react";

// Tonos medios: se leen igual sobre el crema y sobre el fondo oscuro, así que no
// hace falta una paleta por tema. Los neutros pesan más que los acentos para que
// no parezca una piñata.
const COLORS = [
  "#B07A1F", "#C44A3F", "#386E9E", "#3F7A3A", "#8A5CB0", // acentos
  "#C9C3B6", "#C9C3B6", "#A8A296", "#8A8578", // arena y grafito
];

const rnd = (a, b) => a + Math.random() * (b - a);

function makePieces(n) {
  return Array.from({ length: n }, (_, i) => {
    // Tres formas: papelito, redondel y serpentina. La mayoría, papelitos.
    const r = Math.random();
    const shape = r < 0.66 ? "rect" : r < 0.85 ? "round" : "ribbon";
    const w = shape === "ribbon" ? rnd(3, 5) : shape === "round" ? rnd(5, 8) : rnd(5, 9);
    const h = shape === "ribbon" ? rnd(14, 24) : shape === "round" ? w : rnd(7, 13);
    return {
      id: i,
      left: rnd(-2, 102),
      w,
      h,
      round: shape === "round",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      // Deriva lateral: unos se van a la izquierda y otros a la derecha.
      drift: rnd(-140, 140),
      delay: rnd(0, 2.2),
      dur: rnd(3.6, 6.4),
      spin: rnd(0.7, 2.1),
      spinDelay: rnd(-2, 0),
    };
  });
}

/**
 * Lluvia de confeti a pantalla completa. Se genera en cliente (Math.random no
 * puede correr en SSR sin romper la hidratación) y se limpia sola.
 * Se usa en el cumpleaños y al abrir la app con una ausencia recién aprobada.
 */
export default function Confetti({ count = 90, duration = 9000 }) {
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
          className={`confetti-piece${p.round ? " is-round" : ""}`}
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            "--drift": `${p.drift}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        >
          <i
            style={{
              background: p.color,
              animationDuration: `${p.spin}s`,
              animationDelay: `${p.spinDelay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
