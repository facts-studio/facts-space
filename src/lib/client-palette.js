// Paleta categórica de clientes/campañas: tinte de fondo + color legible.
// Compartida por el avatar (portal) y el selector de color (admin).
export const CLIENT_COLORS = [
  { key: "mostaza", bg: "#EEE2C6", fg: "#8A6417" },
  { key: "crema", bg: "#E9E7E1", fg: "#1F1F1E" },
  { key: "terracota", bg: "#F1DCD7", fg: "#B23F34" },
  { key: "azul", bg: "#DBE5F0", fg: "#386E9E" },
  { key: "morado", bg: "#EBE2F6", fg: "#7A4CA0" },
  { key: "salvia", bg: "#DCE7D6", fg: "#3F7A3A" },
];

// Color de un cliente: el elegido (por key) tiene prioridad; si no, determinista
// por el nombre (estable).
export function paletteColor(name, chosenKey) {
  if (chosenKey) {
    const c = CLIENT_COLORS.find((x) => x.key === chosenKey);
    if (c) return c;
  }
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CLIENT_COLORS[h % CLIENT_COLORS.length];
}
