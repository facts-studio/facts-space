// Avatar del equipo: foto si la hay, iniciales con el color de la persona si no.
// Nunca dejamos un círculo vacío — quien acaba de darse de alta todavía no tiene foto.
const TONES = {
  brand: "bg-brandSoft text-brand",
  info: "bg-infoSoft text-info",
  warn: "bg-warnSoft text-warn",
  violet: "bg-violetSoft text-violet",
  success: "bg-successSoft text-success",
  danger: "bg-dangerSoft text-danger",
};

function initials(name = "", lastName = "") {
  const parts = [...String(name).trim().split(/\s+/), String(lastName).trim()]
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase() || "·";
}

export default function Avatar({ name, lastName = "", color = "brand", size = 32, photo = null }) {
  const box = { width: size, height: size };
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt={name || ""} style={box} className="rounded-full object-cover shrink-0" />
    );
  }
  return (
    <span
      style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className={`rounded-full grid place-items-center font-medium shrink-0 select-none ${TONES[color] || TONES.brand}`}
      aria-hidden
    >
      {initials(name, lastName)}
    </span>
  );
}
