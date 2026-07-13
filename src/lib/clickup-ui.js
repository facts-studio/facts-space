// Helpers de presentación de tareas ClickUp (cliente). Sin llamadas ni token.

// Etiqueta de vencimiento relativa a ahora + tono de color.
export function dueLabel(ms, now = Date.now()) {
  if (!ms) return { text: "Sin fecha", tone: "text-mutedSoft" };
  const day = 86400000;
  const nowD = new Date(now);
  const startToday = new Date(now).setHours(0, 0, 0, 0);
  // Fin de la semana de calendario actual (domingo 23:59), lunes = inicio.
  const dow = (nowD.getDay() + 6) % 7;
  const endOfWeek = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate() + (6 - dow)).getTime() + day - 1;
  if (ms < startToday) {
    const d = Math.round((startToday - ms) / day);
    return { text: d <= 1 ? "Ayer" : `Vencida (${d} días)`, tone: "text-danger" };
  }
  if (ms < startToday + day) {
    const t = new Date(ms).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return { text: `Hoy · ${t}`, tone: "text-warn" };
  }
  // Verde si vence dentro de la semana en la que estamos.
  const thisWeek = ms <= endOfWeek ? "text-success" : "text-mutedSoft";
  const d = Math.round((ms - startToday) / day);
  if (d === 1) return { text: "Mañana", tone: thisWeek };
  if (d < 7) return { text: `En ${d} días`, tone: thisWeek };
  const fecha = new Date(ms).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return { text: fecha, tone: thisWeek };
}

// Prioridad ClickUp → etiqueta, tono de texto y color del aro del check.
export const PRIORITY = {
  urgent: { label: "Urgente", tone: "text-danger", ring: "border-danger" },
  high: { label: "Alta", tone: "text-warn", ring: "border-warn" },
  normal: { label: "Normal", tone: "text-mutedSoft", ring: "border-borderStrong" },
  low: { label: "Baja", tone: "text-mutedSoft", ring: "border-info/60" },
};

// Cubeta temporal para agrupar por fecha. Menor `order` = más arriba.
export function dueBucket(ms, now = Date.now()) {
  if (!ms) return { key: "nodate", label: "Sin fecha", order: 5 };
  const day = 86400000;
  const startToday = new Date(now).setHours(0, 0, 0, 0);
  if (ms < startToday) return { key: "overdue", label: "Vencidas", order: 0 };
  if (ms < startToday + day) return { key: "today", label: "Hoy", order: 1 };
  if (ms < startToday + 7 * day) return { key: "week", label: "Esta semana", order: 2 };
  if (ms < startToday + 30 * day) return { key: "month", label: "Este mes", order: 3 };
  return { key: "later", label: "Más adelante", order: 4 };
}
