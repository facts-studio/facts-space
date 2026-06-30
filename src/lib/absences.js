// Catálogo de tipos de ausencia. `vacation` = descuenta del saldo anual de
// vacaciones. `color` usa los tokens del sistema.
export const ABSENCE_TYPES = {
  vacaciones: { label: "Vacaciones", color: "warn", vacation: true },
  baja: { label: "Baja médica", color: "danger", vacation: false, justificante: true },
  permiso: { label: "Permiso retribuido", color: "info", vacation: false, justificante: true },
  asuntos_propios: { label: "Asuntos propios", color: "violet", vacation: false },
  teletrabajo: { label: "Teletrabajo", color: "success", vacation: false },
  otro: { label: "Otro", color: "info", vacation: false },
};

export const absenceLabel = (t) => ABSENCE_TYPES[t]?.label || t;
export const absenceColor = (t) => ABSENCE_TYPES[t]?.color || "info";

// Opciones para selects, en orden.
export const ABSENCE_OPTIONS = Object.entries(ABSENCE_TYPES).map(([value, v]) => ({ value, label: v.label }));

// Permisos retribuidos orientativos (art. 37.3 ET) para ayudar al solicitar.
export const PERMISOS_RETRIBUIDOS = [
  "Matrimonio / pareja de hecho: 15 días naturales",
  "Fallecimiento, accidente o enfermedad grave de familiar: 2–4 días",
  "Hospitalización o intervención sin hospitalización con reposo de familiar: 2–4 días",
  "Mudanza del domicilio habitual: 1 día",
  "Deber inexcusable público y personal (p. ej. votar, juzgado): el tiempo necesario",
  "Exámenes prenatales y preparación al parto: el tiempo necesario",
  "Lactancia (hijo/a menor de 9 meses): 1 hora/día",
];
