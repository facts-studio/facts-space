// Iconos de línea para las fichas de Políticas (estilo minimal, currentColor).
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

function Svg({ children }) {
  return <svg viewBox="0 0 48 48" className="w-full h-full" {...base}>{children}</svg>;
}

export const POLICY_ICONS = {
  // Reloj — horarios
  horarios: (
    <Svg>
      <circle cx="24" cy="24" r="14" />
      <path d="M24 16v8l6 4" />
    </Svg>
  ),
  // Sol — vacaciones
  vacaciones: (
    <Svg>
      <circle cx="24" cy="24" r="7" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        const x1 = 24 + Math.cos(r) * 12, y1 = 24 + Math.sin(r) * 12;
        const x2 = 24 + Math.cos(r) * 17, y2 = 24 + Math.sin(r) * 17;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </Svg>
  ),
  // Bocadillos — comunicación
  comunicacion: (
    <Svg>
      <path d="M10 14h18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H17l-5 4v-4a3 3 0 0 1-2-3v-8a3 3 0 0 1 3-3Z" />
      <path d="M24 22h10a3 3 0 0 1 3 3v6a3 3 0 0 1-2 3v3l-4-3h-4" opacity=".55" />
    </Svg>
  ),
  // Columnas — organización
  organizacion: (
    <Svg>
      <rect x="9" y="12" width="8" height="24" rx="2" />
      <rect x="20" y="12" width="8" height="16" rx="2" />
      <rect x="31" y="12" width="8" height="20" rx="2" />
    </Svg>
  ),
  // Candado — seguridad
  seguridad: (
    <Svg>
      <rect x="13" y="22" width="22" height="15" rx="3" />
      <path d="M18 22v-4a6 6 0 0 1 12 0v4" />
      <circle cx="24" cy="29" r="1.6" fill="currentColor" stroke="none" />
      <path d="M24 30.5v2.5" />
    </Svg>
  ),
};
