"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Asterisco sólido de la marca (el glifo derecho del logo, ver FctsMark.jsx).
const ASTERISCO =
  "M152.204 1.58398C160.526 1.58399 164.869 7.21267 164.869 13.5449C164.869 19.5254 161.611 26.2099 159.802 32.1904C159.441 33.5974 161.612 34.6528 162.698 33.5977C167.402 29.3761 171.744 24.4505 177.171 20.9326C180.066 19.5254 182.961 18.8223 185.856 18.8223C189.836 18.8223 193.093 20.5815 195.625 24.4512C199.606 30.4316 197.073 36.0602 190.198 39.5781C183.684 43.0959 174.638 44.1512 167.04 45.9102C165.231 46.2621 165.231 48.0213 166.678 48.373C175 50.4837 184.77 51.8907 190.198 55.0566C197.797 58.9264 199.244 64.2041 195.625 70.1846C193.093 74.054 189.836 75.8125 185.856 75.8125C182.961 75.8125 180.428 75.1093 177.171 73.7021C171.744 70.1842 167.039 65.2586 162.335 61.0371C161.25 59.9821 159.441 60.6858 159.802 62.0928C161.611 68.4251 164.869 74.7576 164.869 81.0898C164.869 87.7738 160.164 93.0508 152.204 93.0508C143.881 93.0507 139.54 87.7738 139.54 81.0898C139.54 75.4613 142.796 68.4254 144.605 61.3896C144.967 60.3343 142.796 59.2787 141.71 60.334C136.645 64.5555 130.854 70.5355 126.512 72.998C123.617 74.7569 120.723 75.4609 118.19 75.4609C114.21 75.4609 110.591 73.3501 108.058 69.4805C104.44 63.5001 106.973 57.8715 113.486 54.3535C119.275 51.5392 128.684 50.132 136.283 48.373C137.73 48.0212 137.73 46.2621 136.283 45.9102C128.322 43.7994 117.828 42.3922 113.486 39.9297C106.611 36.4117 104.078 31.135 107.697 24.8027C110.592 20.9331 114.571 19.1739 118.914 19.1738C121.446 19.1738 123.979 19.5256 126.512 20.9326C131.216 23.7469 136.644 29.7275 142.072 34.3008C143.157 35.356 144.966 34.3013 144.605 33.2461C143.158 26.562 139.54 19.8772 139.54 13.5449C139.54 6.86096 143.519 1.58411 152.204 1.58398Z";
// Matriz calculada UNA VEZ a partir de la caja del glifo (x 106.05, y 1.58,
// 91.47 × 91.47): escala a 10 unidades y lo centra. Se deja fija porque
// dejar que shapeFromPath la calcule cuesta rendimiento en cada arranque.
const ASTERISCO_MATRIX = [0.10932926306928527, 0, 0, 0.10932926306928527, -16.594438747895005, -5.173175362208653];

// Gama de la marca: negros, taupes y cremas. Al mezclar los dos extremos se lee
// igual en claro y en oscuro (los oscuros destacan sobre el crema y al revés).
// El mostaza es el único acento, para que no sea del todo monocromo.
const COLORS = ["#1F1F1E", "#3F3F3C", "#5A5852", "#8A8578", "#C9C3B6", "#E9E7E1", "#B07A1F"];

/**
 * Celebración a pantalla completa (canvas-confetti, MIT): asteriscos de la
 * marca cayendo desde arriba. Velocidad de salida NEGATIVA para que el disparo
 * vaya hacia abajo, y `spread: 180` para repartirlos a lo ancho.
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
      const asterisco = confetti.shapeFromPath({ path: ASTERISCO, matrix: ASTERISCO_MATRIX });

      const base = {
        colors: COLORS,
        shapes: [asterisco],
        disableForReducedMotion: true,
        zIndex: 60,
        spread: 180,
        origin: { y: -0.1 },
        startVelocity: -35, // negativo = hacia abajo
        ticks: 320,
        gravity: 0.9,
      };
      const shoot = (opts) => { if (!cancelled && fire) fire({ ...base, ...opts }); };

      // Tres tandas escalonadas y de distinto tamaño: da profundidad (los
      // grandes se leen cerca y los pequeños al fondo) y evita el vaciado
      // de golpe.
      shoot({ particleCount: 18, scalar: 2 });
      timers.push(setTimeout(() => shoot({ particleCount: 16, scalar: 1.4 }), 240));
      timers.push(setTimeout(() => shoot({ particleCount: 14, scalar: 2.4 }), 560));
      timers.push(setTimeout(() => shoot({ particleCount: 12, scalar: 1.1 }), 900));
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
