// Iconos por defecto de clientes/campañas (SVG en public/clients). Se muestran
// en los avatares; si no hay icono para ese nombre, se cae a la inicial.
// El admin puede subir/override el SVG por carpeta (se guarda en clickup_lists.icon).
const CLIENT_ICONS = {
  "Unfiltrade": "/clients/unfiltrade.svg",
  "TradingLab": "/clients/tradinglab.svg",
  "Flickflow": "/clients/flickflow.svg",
  "The BenchMark": "/clients/benchmark.svg",
  "Alex Ruiz": "/clients/alex.svg",
  "F*cts Studio": "/clients/fcts.svg",
};

// Devuelve el icono a usar. `uploaded`:
//  · "none"      → sin icono explícito (→ inicial), aunque haya por defecto.
//  · data-URI/URL → ese icono.
//  · null/undef  → icono por defecto por nombre, si existe.
export function clientIcon(name, uploaded) {
  if (uploaded === "none") return null;
  return uploaded || CLIENT_ICONS[name] || null;
}
