// Datos ficticios para previsualizar el sistema completo.
// En la Fase 1 esto se sustituye por consultas a Supabase.

// Fotos reales en /public/team. Roles "por definir" hasta confirmarlos.
export const TEAM = [
  { id: 1, name: "Álvaro", role: "Director Creativo & Head UX/UI", email: "alvaro@fcts.studio", birthday: "1990-05-05", color: "brand", photo: "/team/alvaro.jpg" },
  { id: 2, name: "Alba", role: "Copywriter & Trader", email: "alba@fcts.studio", birthday: "1990-03-06", color: "info", photo: "/team/alba.jpg" },
  { id: 3, name: "Carla", role: "Social Media Manager", email: "carla@fcts.studio", birthday: "1990-08-03", color: "violet", photo: "/team/carla.jpg" },
  { id: 4, name: "Carles", role: "Product Designer & Front Developer", email: "carles@fcts.studio", birthday: "1990-07-30", color: "warn", photo: "/team/carles.jpg" },
  { id: 5, name: "Lucas", role: "CCO & Director del Área de Producto", email: "lucas@fcts.studio", birthday: "1993-09-30", color: "success", photo: "/team/lucas.jpg" },
  { id: 6, name: "Mariola", role: "Graphic Designer", email: "mariola@fcts.studio", birthday: "1990-09-10", color: "info", photo: "/team/mariola.jpg" },
  { id: 7, name: "Samu", role: "Product Developer", email: "samu@fcts.studio", birthday: "1994-03-03", color: "brand", photo: "/team/samu.jpg" },
];

// Tipos de evento → color del sistema (tokens del design system).
export const EVENT_TYPES = {
  hito: { label: "Hito", color: "danger" },
  cumple: { label: "Cumpleaños", color: "info" },
  vacaciones: { label: "Vacaciones", color: "warn" },
  festivo: { label: "Festivo", color: "success" },
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
  { id: 44, type: "hito", title: "Black Friday", start: "2026-11-27", end: "2026-11-27", who: null },
];

// Novedades de empresa (lo que NO es un evento de calendario): comunicados,
// recursos nuevos, políticas actualizadas. Se mezclan con los próximos eventos
// en el panel de la derecha.
export const NEWS = [
  { id: "n1", tone: "brand", icon: "❡", tag: "Políticas", title: "Política de vacaciones actualizada", sub: "Reparto orientativo por trimestres y antelación.", date: "2026-06-26", cta: "Leer", to: "/politicas/vacaciones" },
  { id: "n2", tone: "success", icon: "✦", tag: "Recursos", title: "Fichas de herramientas", sub: "Para qué sirve cada una y qué evitar.", date: "2026-06-24", cta: "Ver", to: "/recursos" },
  { id: "n3", tone: "info", icon: "✻", tag: "Onboarding", title: "Nuevo recorrido de onboarding", sub: "Qué es F*cts, cultura, políticas y herramientas.", date: "2026-06-20", cta: "Empezar", to: "/onboarding" },
];

// Onboarding — recorrido lineal para quien acaba de entrar a F*cts.
export const ONBOARDING = [
  { id: "que", num: "01", icon: "✳", cover: "que", title: "Qué es F*cts", desc: "Quiénes somos, qué hacemos y la visión del estudio.", min: 5 },
  { id: "cultura", num: "02", icon: "❖", cover: "cultura", title: "Cultura y equipo", desc: "Cómo nos relacionamos, valores y quién es quién.", min: 6 },
  { id: "politicas", num: "03", icon: "♥", cover: "politicas", title: "Políticas internas", desc: "Horarios, vacaciones, comunicación y seguridad.", min: 8 },
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
