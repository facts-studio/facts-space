// Isotipo de F*cts Studio: el asterisco de 6 pétalos.
// Vectorial y monocromo (currentColor) → se tiñe con el color que herede.
export default function FctsMark({ className = "", title = "F*cts Studio" }) {
  // Pétalo lagrimal: punta en el centro (0,0), bulbo hacia arriba.
  const petal = "M0 0 C16 -14 16 -40 0 -45 C-16 -40 -16 -14 0 0 Z";
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      <g transform="translate(50 50)">
        {petals.map((deg) => (
          <path key={deg} d={petal} transform={`rotate(${deg})`} />
        ))}
      </g>
    </svg>
  );
}
