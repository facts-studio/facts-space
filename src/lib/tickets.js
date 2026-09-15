// Helpers puros de tickets. Viven fuera de data/slack.js (que es server-only)
// para que los pueda usar también el componente del panel.
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Estados que cuentan como cerrados: no ocupan sitio en Inicio.
const DONE = ["listo", "hecho", "cerrado", "completado", "done", "finalizado", "entregado"];

export const statusKey = (status) => norm(status);
export const isOpenTicket = (t) => !DONE.includes(norm(t.status));
export const isUnassigned = (t) => !t.assignee;

// Tickets cerrados hace poco, para el repaso del lunes. Slack no guarda la
// fecha de cierre: se usa la última modificación, que en un ticket ya en Listo
// es casi siempre el momento en que se cerró.
export function ticketsCerradosDesde(tickets = [], desde) {
  return tickets
    .filter((t) => !isOpenTicket(t) && t.updatedAt && t.updatedAt >= desde)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
