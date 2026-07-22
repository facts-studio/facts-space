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
      const base = {
        colors: COLORS,
        disableForReducedMotion: true,
        scalar: 0.95,
        zIndex: 60,
        // angle 270 = hacia abajo. Velocidad baja y gravedad suave para que
        // planee en vez de caer a plomo.
        angle: 270,
        startVelocity: 22,
        decay: 0.945,
        gravity: 0.85,
        ticks: 340,
      };
      const shoot = (opts) => { if (!cancelled && fire) fire({ ...base, ...opts }); };

      // Lluvia desde arriba: ráfagas escalonadas a lo ancho, con deriva lateral
      // distinta en cada una, para que parezca que sigue cayendo y no un único
      // vaciado de golpe. y: -0.1 → nacen fuera de la ventana.
      const rafaga = (x, delay, particleCount, drift) =>
        timers.push(setTimeout(() => shoot({ particleCount, spread: 75, drift, origin: { x, y: -0.1 } }), delay));

      rafaga(0.2, 0, 26, -0.5);
      rafaga(0.8, 60, 26, 0.5);
      rafaga(0.5, 220, 30, 0);
      rafaga(0.35, 480, 22, 0.6);
      rafaga(0.68, 620, 22, -0.6);
      rafaga(0.5, 950, 26, 0.2);
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
