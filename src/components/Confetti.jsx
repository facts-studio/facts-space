"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Tonos medios: se leen igual sobre el crema y sobre el fondo oscuro, así que no
// hace falta una paleta por tema. Los neutros pesan para que no parezca piñata.
const COLORS = ["#B07A1F", "#C44A3F", "#386E9E", "#3F7A3A", "#8A5CB0", "#C9C3B6", "#8A8578"];

/**
 * Celebración a pantalla completa (canvas-confetti, MIT). Dos cañones desde las
 * esquinas de abajo y un remate central: el confeti sube, pierde fuerza y cae
 * con gravedad, en vez de bajar recto.
 *
 * Va sobre su propio <canvas> (no el global de la librería) para poder pararlo
 * al desmontar. `disableForReducedMotion` respeta la preferencia del sistema.
 *
 * Se monta por portal en <body>: dentro del árbol, cualquier ancestro con
 * `transform` (p. ej. la animación `fade-up`) se convierte en el bloque
 * contenedor del `fixed` y el canvas acaba con el tamaño del contenido en vez
 * del de la ventana, disparando el confeti fuera de la vista.
 */
export default function Confetti() {
  const ref = useRef(null);
  const [listo, setListo] = useState(false);

  // El portal necesita document: solo en cliente. En rAF, para no encadenar un
  // render síncrono desde el efecto.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setListo(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let fire = null;
    const timers = [];

    if (!listo) return;

    (async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled || !ref.current) return;

      fire = confetti.create(ref.current, { resize: true });
      const base = { colors: COLORS, disableForReducedMotion: true, scalar: 0.95, ticks: 260, zIndex: 60 };
      const shoot = (opts) => { if (!cancelled && fire) fire({ ...base, ...opts }); };

      // Cañones laterales a la vez…
      shoot({ particleCount: 55, angle: 60, spread: 55, startVelocity: 58, origin: { x: 0, y: 1 } });
      shoot({ particleCount: 55, angle: 120, spread: 55, startVelocity: 58, origin: { x: 1, y: 1 } });
      // …y un golpe central algo después, para que no sea un único "pop".
      timers.push(setTimeout(() => shoot({ particleCount: 45, spread: 100, startVelocity: 45, decay: 0.92, origin: { x: 0.5, y: 1 } }), 280));
      // Remate corto y bajo: da sensación de rebote final.
      timers.push(setTimeout(() => {
        shoot({ particleCount: 22, angle: 75, spread: 70, startVelocity: 40, origin: { x: 0.15, y: 1 } });
        shoot({ particleCount: 22, angle: 105, spread: 70, startVelocity: 40, origin: { x: 0.85, y: 1 } });
      }, 700));
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (fire) fire.reset();
    };
  }, [listo]);

  if (!listo) return null;

  return createPortal(
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />,
    document.body
  );
}
