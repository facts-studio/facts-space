// Portadas abstractas para las tarjetas de Onboarding. Monocromas: fondo
// oscuro fijo + arte en blanco (estilo galería de la referencia). Color fijo
// (no theme-aware) para que la portada sea siempre negra como en el original.
const W = "#FFFFFF";

function Frame({ children }) {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}

export function CoverQue() {
  return (
    <Frame>
      <circle cx="100" cy="65" r="34" fill={W} />
    </Frame>
  );
}

export function CoverCultura() {
  const xs = [70, 90, 110, 130];
  const ys = [50, 80];
  return (
    <Frame>
      {ys.map((y) => xs.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" fill={W} />))}
    </Frame>
  );
}

export function CoverPoliticas() {
  return (
    <Frame>
      <ellipse cx="100" cy="65" rx="48" ry="30" fill="none" stroke={W} strokeWidth="3" />
      <circle cx="100" cy="65" r="16" fill="none" stroke={W} strokeWidth="3" />
      <line x1="92" y1="65" x2="108" y2="65" stroke={W} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

export function CoverHerramientas() {
  // Línea almenada (square-wave) a base de cuadrados.
  return (
    <Frame>
      <path
        d="M58 78 H74 V54 H90 V78 H106 V54 H122 V78 H138 V54 H154"
        fill="none"
        stroke={W}
        strokeWidth="3"
        strokeLinejoin="miter"
      />
    </Frame>
  );
}

export function CoverTareas() {
  // Barras horizontales de distinto largo (lista / progreso).
  const bars = [
    [0, 64],
    [1, 84],
    [2, 50],
    [3, 76],
    [4, 40],
  ];
  return (
    <Frame>
      {bars.map(([i, w]) => (
        <rect key={i} x="60" y={44 + i * 12} width={w} height="5" rx="2.5" fill={W} />
      ))}
    </Frame>
  );
}

export const COVERS = {
  que: CoverQue,
  cultura: CoverCultura,
  politicas: CoverPoliticas,
  herramientas: CoverHerramientas,
  tareas: CoverTareas,
};
