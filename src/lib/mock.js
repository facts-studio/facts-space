// Datos ficticios para previsualizar el sistema completo.
// En la Fase 1 esto se sustituye por consultas a Supabase.

export const TEAM = [
  { id: 1, name: "Álvaro Vigil", role: "Dirección creativa", email: "alvaro@fcts.studio", birthday: "1992-03-14", color: "brand" },
  { id: 2, name: "Marina Soler", role: "Diseño de marca", email: "marina@fcts.studio", birthday: "1995-07-02", color: "info" },
  { id: 3, name: "Bruno Esteve", role: "Desarrollo", email: "bruno@fcts.studio", birthday: "1990-11-22", color: "violet" },
  { id: 4, name: "Lucía Ferrer", role: "Project manager", email: "lucia@fcts.studio", birthday: "1997-01-09", color: "warn" },
  { id: 5, name: "Owen Marsh", role: "Motion & 3D", email: "owen@fcts.studio", birthday: "1993-09-30", color: "success" },
];

// Tipos de evento → color del sistema (tokens del design system).
export const EVENT_TYPES = {
  hito: { label: "Hito", color: "brand" },
  cumple: { label: "Cumpleaños", color: "info" },
  vacaciones: { label: "Vacaciones", color: "warn" },
  festivo: { label: "Festivo", color: "violet" },
};

export const EVENTS = [
  { id: 1, type: "festivo", title: "San Juan", start: "2026-06-24", end: "2026-06-24", who: null },
  { id: 2, type: "hito", title: "Entrega rebrand Aurora", start: "2026-07-03", end: "2026-07-03", who: "Marina Soler" },
  { id: 3, type: "cumple", title: "Cumpleaños de Marina", start: "2026-07-02", end: "2026-07-02", who: "Marina Soler" },
  { id: 4, type: "vacaciones", title: "Vacaciones de Bruno", start: "2026-07-07", end: "2026-07-18", who: "Bruno Esteve" },
  { id: 5, type: "hito", title: "Kickoff proyecto Nimbus", start: "2026-07-10", end: "2026-07-10", who: "Lucía Ferrer" },
  { id: 6, type: "festivo", title: "Festivo local", start: "2026-07-15", end: "2026-07-15", who: null },
  { id: 7, type: "vacaciones", title: "Vacaciones de Owen", start: "2026-07-21", end: "2026-07-31", who: "Owen Marsh" },
  { id: 8, type: "hito", title: "Presentación cliente Vela", start: "2026-07-24", end: "2026-07-24", who: "Álvaro Vigil" },
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

// Helpers de fecha (formato es-ES).
export function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
export function fmtRange(start, end) {
  if (start === end) return fmtDate(start);
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}
