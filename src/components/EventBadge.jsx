// Badge y punto de color por tipo de evento. Clases explícitas (no dinámicas)
// para que Tailwind las incluya en el build.
const STYLES = {
  brand: { dot: "bg-brand", pill: "bg-brandSoft text-brand" },
  info: { dot: "bg-info", pill: "bg-infoSoft text-info" },
  warn: { dot: "bg-warn", pill: "bg-warnSoft text-warn" },
  violet: { dot: "bg-violet", pill: "bg-violetSoft text-violet" },
  success: { dot: "bg-success", pill: "bg-successSoft text-success" },
  danger: { dot: "bg-danger", pill: "bg-dangerSoft text-danger" },
};

export function EventDot({ color }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${(STYLES[color] || STYLES.brand).dot}`} />;
}

export function EventPill({ color, children }) {
  return <span className={`pill ${(STYLES[color] || STYLES.brand).pill}`}>{children}</span>;
}

export function Avatar({ name, color = "brand", size = 32, photo = null }) {
  const s = STYLES[color] || STYLES.brand;
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name || ""}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`rounded-full grid place-items-center font-medium shrink-0 ${s.pill}`}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}
    >
      {name?.[0]?.toUpperCase()}
    </span>
  );
}
