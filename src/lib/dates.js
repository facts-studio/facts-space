// Utilidades de fecha en formato ISO "YYYY-MM-DD", sin dependencias externas
// (el proyecto hace las fechas a mano; ver VacacionesChecker.jsx).

export const parse = (iso) => (iso ? new Date(iso + "T00:00:00") : null);
export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Días naturales (ambos incluidos).
export function naturalDays(startISO, endISO) {
  const a = parse(startISO);
  const b = parse(endISO || startISO);
  return Math.round((b - a) / 86400000) + 1;
}

// Días laborables entre dos fechas (ambas incluidas), excluyendo sábados,
// domingos y los festivos pasados en `holidays` (Set o array de ISO).
export function workingDaysBetween(startISO, endISO, holidays = []) {
  const set = holidays instanceof Set ? holidays : new Set(holidays);
  const a = parse(startISO);
  const b = parse(endISO || startISO);
  let n = 0;
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w === 0 || w === 6) continue;
    if (set.has(iso(d))) continue;
    n++;
  }
  return n;
}

// Año natural de una fecha ISO.
export const yearOf = (iso) => Number(iso.slice(0, 4));

// Fecha local de España (Europe/Madrid) en ISO "YYYY-MM-DD". El servidor corre
// en UTC; el registro de jornada debe usar la hora local del centro de trabajo.
export function madridDateISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Hora local de España "HH:MM" de un instante (Date o ISO string).
export function madridTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Formatea una duración en ms como "Xh Ym" (o "Ym" si <1h).
export function formatDuration(ms) {
  if (!ms || ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
