// Helpers puros de tickets. Viven fuera de data/slack.js (que es server-only)
// para que los pueda usar también el componente del panel.
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Estados que cuentan como cerrados: no ocupan sitio en Inicio.
const DONE = ["listo", "hecho", "cerrado", "completado", "done", "finalizado", "entregado"];

export const statusKey = (status) => norm(status);
export const isOpenTicket = (t) => !DONE.includes(norm(t.status));
export const isUnassigned = (t) => !t.assignee;
