// Badge y punto de color por tipo de evento. Clases explícitas (no dinámicas)
// para que Tailwind las incluya en el build.
const STYLES = {
  brand: { dot: "bg-brand", pill: "bg-brandSoft text-brand" },
  info: { dot: "bg-info", pill: "bg-infoSoft text-info" },
  warn: { dot: "bg-warn", pill: "bg-warnSoft text-warn" },
  violet: { dot: "bg-violet", pill: "bg-violetSoft text-violet" },
  success: { dot: "bg-success", pill: "bg-successSoft text-success" },
};

export function EventDot({ color }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${(STYLES[color] || STYLES.brand).dot}`} />;
}

export function EventPill({ color, children }) {
  return <span className={`pill ${(STYLES[color] || STYLES.brand).pill}`}>{children}</span>;
}

export function Avatar({ name, color = "brand", size = 32 }) {
  const s = STYLES[color] || STYLES.brand;
  return (
    <span
      className={`rounded-full grid place-items-center text-[12px] font-medium ${s.pill}`}
      style={{ width: size, height: size }}
    >
      {name?.[0]?.toUpperCase()}
    </span>
  );
}
