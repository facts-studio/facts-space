// Datos ficticios para previsualizar el sistema completo.
// En la Fase 1 esto se sustituye por consultas a Supabase.

// Fotos reales en /public/team. Roles "por definir" hasta confirmarlos.
export const TEAM = [
  { id: 1, name: "Álvaro", role: "Dirección creativa", email: "alvaro@fcts.studio", birthday: "1990-05-05", color: "brand", photo: "/team/alvaro.jpg" },
  { id: 2, name: "Alba", role: "Por definir", email: "alba@fcts.studio", birthday: "1990-03-06", color: "info", photo: "/team/alba.jpg" },
  { id: 3, name: "Carla", role: "Por definir", email: "carla@fcts.studio", birthday: "1990-08-03", color: "violet", photo: "/team/carla.jpg" },
  { id: 4, name: "Carles", role: "Por definir", email: "carles@fcts.studio", birthday: "1990-07-30", color: "warn", photo: "/team/carles.jpg" },
  { id: 5, name: "Lucas", role: "Por definir", email: "lucas@fcts.studio", birthday: "1993-09-30", color: "success", photo: "/team/lucas.jpg" },
  { id: 6, name: "Mariola", role: "Por definir", email: "mariola@fcts.studio", birthday: "1990-09-10", color: "info", photo: "/team/mariola.jpg" },
  { id: 7, name: "Samu", role: "Por definir", email: "samu@fcts.studio", birthday: "1994-03-03", color: "brand", photo: "/team/samu.jpg" },
];

// Tipos de evento → color del sistema (tokens del design system).
export const EVENT_TYPES = {
  hito: { label: "Hito", color: "brand" },
  cumple: { label: "Cumpleaños", color: "info" },
  vacaciones: { label: "Vacaciones", color: "warn" },
  festivo: { label: "Festivo", color: "violet" },
};

export const EVENTS = [
  { id: 1, type: "vacaciones", title: "Vacaciones Mariola", start: "2026-02-02", end: "2026-02-02", who: "Mariola" },
  { id: 2, type: "vacaciones", title: "Vacaciones Carles", start: "2026-02-27", end: "2026-02-27", who: "Carles" },
  { id: 3, type: "vacaciones", title: "Vacaciones Alba", start: "2026-03-09", end: "2026-03-09", who: "Alba" },
  { id: 4, type: "vacaciones", title: "Vacaciones Carles", start: "2026-03-13", end: "2026-03-13", who: "Carles" },
  { id: 5, type: "vacaciones", title: "Vacaciones Mariola", start: "2026-03-16", end: "2026-03-16", who: "Mariola" },
  { id: 6, type: "vacaciones", title: "Vacaciones Carles", start: "2026-03-23", end: "2026-03-23", who: "Carles" },
  { id: 7, type: "vacaciones", title: "Vacaciones Álvaro", start: "2026-04-01", end: "2026-04-14", who: "Álvaro" },
  { id: 8, type: "vacaciones", title: "Vacaciones Carla", start: "2026-04-13", end: "2026-04-13", who: "Carla" },
  { id: 9, type: "vacaciones", title: "Vacaciones Alba", start: "2026-04-30", end: "2026-04-30", who: "Alba" },
  { id: 10, type: "vacaciones", title: "Vacaciones Carla", start: "2026-05-07", end: "2026-05-08", who: "Carla" },
  { id: 11, type: "vacaciones", title: "Dia libre Mariola", start: "2026-06-22", end: "2026-06-22", who: "Mariola" },
  { id: 12, type: "vacaciones", title: "Vacaciones Alba", start: "2026-06-22", end: "2026-06-23", who: "Alba" },
  { id: 13, type: "vacaciones", title: "Vacaciones Mariola", start: "2026-06-25", end: "2026-06-26", who: "Mariola" },
  { id: 14, type: "vacaciones", title: "Vacaciones Carla", start: "2026-06-29", end: "2026-06-30", who: "Carla" },
  { id: 15, type: "vacaciones", title: "Vacaciones Mariola", start: "2026-07-16", end: "2026-07-23", who: "Mariola" },
  { id: 16, type: "vacaciones", title: "Vacaciones Alba", start: "2026-08-24", end: "2026-08-28", who: "Alba" },
  { id: 17, type: "vacaciones", title: "Vacaciones Mariola", start: "2026-08-24", end: "2026-08-28", who: "Mariola" },
  { id: 18, type: "vacaciones", title: "Vacaciones Alba", start: "2026-08-31", end: "2026-08-31", who: "Alba" },
  { id: 19, type: "vacaciones", title: "Vacaciones Alba", start: "2026-09-01", end: "2026-09-04", who: "Alba" },
  { id: 20, type: "vacaciones", title: "Vacaciones Alba", start: "2026-09-14", end: "2026-09-14", who: "Alba" },
  { id: 21, type: "vacaciones", title: "Vacaciones Alba", start: "2026-10-13", end: "2026-10-13", who: "Alba" },
  { id: 22, type: "vacaciones", title: "Vacaciones Mariola", start: "2026-12-07", end: "2026-12-07", who: "Mariola" },
  { id: 23, type: "vacaciones", title: "Vacaciones Alba", start: "2026-12-07", end: "2026-12-07", who: "Alba" },
  { id: 24, type: "festivo", title: "Año Nuevo", start: "2026-01-01", end: "2026-01-01", who: null },
  { id: 25, type: "festivo", title: "Día de Reyes", start: "2026-01-06", end: "2026-01-06", who: null },
  { id: 26, type: "festivo", title: "Viernes Santo", start: "2026-04-03", end: "2026-04-03", who: null },
  { id: 27, type: "festivo", title: "Lunes de Pascua", start: "2026-04-06", end: "2026-04-06", who: null },
  { id: 28, type: "festivo", title: "Día del Trabajador", start: "2026-05-01", end: "2026-05-01", who: null },
  { id: 29, type: "festivo", title: "San Juan", start: "2026-06-24", end: "2026-06-24", who: null },
  { id: 30, type: "festivo", title: "Asunción de la Virgen", start: "2026-08-15", end: "2026-08-15", who: null },
  { id: 31, type: "festivo", title: "Día Nacional de Cataluña", start: "2026-09-11", end: "2026-09-11", who: null },
  { id: 32, type: "festivo", title: "La Mercè", start: "2026-09-24", end: "2026-09-24", who: null },
  { id: 33, type: "festivo", title: "Fiesta nacional de España", start: "2026-10-12", end: "2026-10-12", who: null },
  { id: 34, type: "festivo", title: "Día de Todos los Santos", start: "2026-11-01", end: "2026-11-01", who: null },
  { id: 35, type: "festivo", title: "Día de la Constitución", start: "2026-12-06", end: "2026-12-06", who: null },
  { id: 36, type: "festivo", title: "Día de la Inmaculada Concepción", start: "2026-12-08", end: "2026-12-08", who: null },
  { id: 37, type: "festivo", title: "Navidad", start: "2026-12-25", end: "2026-12-25", who: null },
  { id: 38, type: "festivo", title: "San Esteban", start: "2026-12-26", end: "2026-12-26", who: null },
  { id: 39, type: "cumple", title: "Cumpleaños Alba", start: "2026-03-06", end: "2026-03-06", who: "Alba" },
  { id: 40, type: "cumple", title: "Cumpleaños Álvaro", start: "2026-05-05", end: "2026-05-05", who: "Álvaro" },
  { id: 41, type: "cumple", title: "Cumpleaños Carles", start: "2026-07-30", end: "2026-07-30", who: "Carles" },
  { id: 42, type: "cumple", title: "Cumpleaños Carla", start: "2026-08-03", end: "2026-08-03", who: "Carla" },
  { id: 43, type: "cumple", title: "Cumpleaños Mariola", start: "2026-09-10", end: "2026-09-10", who: "Mariola" },
];

export const POLICY_CATEGORIES = [
  {
    name: "Empezar aquí",
    eyebrow: "Onboarding",
    policies: [
      { id: "bienvenida", title: "Bienvenido/a a F*cts Studio", summary: "Quiénes somos, cómo trabajamos y qué esperar tus primeras semanas.", updated: "2026-06-10", min: 6 },
      { id: "herramientas", title: "Herramientas y accesos", summary: "ClickUp, Drive, Holded, Figma y cómo pedir accesos.", updated: "2026-06-12", min: 4 },
      { id: "comunicacion", title: "Cómo nos comunicamos", summary: "Canales, tono, reuniones y tiempos de respuesta.", updated: "2026-05-28", min: 3 },
    ],
  },
  {
    name: "Tiempo y descanso",
    eyebrow: "Personas",
    policies: [
      { id: "vacaciones", title: "Política de vacaciones", summary: "Días disponibles, cómo solicitarlos y plazos de aviso.", updated: "2026-06-01", min: 5 },
      { id: "festivos", title: "Festivos y calendario laboral", summary: "Festivos nacionales, autonómicos y cierres del estudio.", updated: "2026-01-15", min: 2 },
      { id: "flexibilidad", title: "Horario y flexibilidad", summary: "Franja común, trabajo en remoto y desconexión.", updated: "2026-04-20", min: 3 },
    ],
  },
  {
    name: "Cómo trabajamos",
    eyebrow: "Operativa",
    policies: [
      { id: "proyectos", title: "Ciclo de vida de un proyecto", summary: "De brief a entrega: fases, roles y checkpoints.", updated: "2026-06-18", min: 8 },
      { id: "gastos", title: "Gastos y dietas", summary: "Qué se cubre, límites y cómo reportar en Holded.", updated: "2026-03-11", min: 4 },
    ],
  },
];

export const RESOURCE_CATEGORIES = [
  {
    name: "Programas y licencias",
    resources: [
      { id: 1, title: "Figma", desc: "Diseño UI y design systems", url: "https://figma.com", tag: "Equipo" },
      { id: 2, title: "Adobe Creative Cloud", desc: "Suite gráfica completa", url: "https://adobe.com", tag: "5 licencias" },
      { id: 3, title: "ClickUp", desc: "Gestión de proyectos y tareas", url: "https://clickup.com", tag: "Equipo" },
      { id: 4, title: "Holded", desc: "Facturación y administración", url: "https://holded.com", tag: "Admin" },
    ],
  },
  {
    name: "Marca y plantillas",
    resources: [
      { id: 5, title: "Brand assets F*cts", desc: "Logos, tipografías y paleta", url: "https://drive.google.com", tag: "Drive" },
      { id: 6, title: "Plantillas de propuesta", desc: "Keynote y Figma listos para usar", url: "https://figma.com", tag: "Figma" },
      { id: 7, title: "Plantilla de presupuesto", desc: "Hoja de cálculo estándar", url: "https://drive.google.com", tag: "Drive" },
    ],
  },
  {
    name: "Inspiración y referencias",
    resources: [
      { id: 8, title: "Raindrop del estudio", desc: "Bookmarks curados por área", url: "https://raindrop.io", tag: "Raindrop" },
      { id: 9, title: "Carpeta de referencias", desc: "Moodboards y benchmarks", url: "https://drive.google.com", tag: "Drive" },
    ],
  },
];

// Novedades de empresa (lo que NO es un evento de calendario): comunicados,
// recursos nuevos, políticas actualizadas. Se mezclan con los próximos eventos
// en el panel de la derecha.
export const NEWS = [
  { id: "n1", tone: "brand", icon: "❡", tag: "Políticas", title: "Nueva política de vacaciones", sub: "Revisada para la temporada de verano.", date: "2026-06-26", cta: "Leer", to: "/politicas" },
  { id: "n2", tone: "success", icon: "✦", tag: "Recursos", title: "Plantillas de propuesta añadidas", sub: "Keynote y Figma listos para usar.", date: "2026-06-24", cta: "Ver", to: "/recursos" },
  { id: "n3", tone: "info", icon: "✻", tag: "Estudio", title: "Bienvenido, Owen 👋", sub: "Se incorpora al equipo de Motion & 3D.", date: "2026-06-20", cta: null, to: null },
];

// Onboarding — recorrido lineal para quien acaba de entrar a F*cts.
export const ONBOARDING = [
  { id: "que", num: "01", icon: "✳", cover: "que", title: "Qué es F*cts", desc: "Quiénes somos, qué hacemos y la visión del estudio.", min: 5 },
  { id: "cultura", num: "02", icon: "❖", cover: "cultura", title: "Cultura y equipo", desc: "Cómo nos relacionamos, valores y quién es quién.", min: 6 },
  { id: "politicas", num: "03", icon: "♥", cover: "politicas", title: "Políticas internas", desc: "Vacaciones, horarios, gastos y desconexión.", min: 8 },
  { id: "herramientas", num: "04", icon: "◐", cover: "herramientas", title: "Herramientas", desc: "ClickUp, Drive, Figma, Holded y cómo pedir accesos.", min: 4 },
  { id: "tareas", num: "05", icon: "✓", cover: "tareas", title: "Tareas de onboarding", desc: "Tu checklist de las primeras dos semanas.", min: 3 },
];

// Helpers de fecha (formato es-ES).
export function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
export function fmtRange(start, end) {
  if (start === end) return fmtDate(start);
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}
