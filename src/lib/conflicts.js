// Cruce tareas ↔ ausencias: detecta cuándo a una persona se le ha asignado una
// tarea cuya fecha cae en un día en que ESA MISMA persona está de vacaciones o
// ausencia aprobada. Mismo criterio que el resaltado de conflictos del calendario.
//
// Puro (sin I/O): recibe los eventos del calendario y las tareas ya cargadas.
//   events: [{ type, who, start, end, pending }]  (vacaciones/ausencia aprobadas)
//   tasks:  [{ id, name, url, assignees:[{name}], everyone, dueDate(ms), startDate(ms), statusType }]
// Devuelve: [{ taskId, taskName, url, person, date }] (una por tarea+persona).

function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoFromMs(ms) {
  return isoFromDate(new Date(Number(ms)));
}
function eachDayISO(startISO, endISO, fn) {
  const d = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  let guard = 0;
  while (d <= end && guard < 370) { fn(isoFromDate(d)); d.setDate(d.getDate() + 1); guard++; }
}

export function taskVacationConflicts(events = [], tasks = []) {
  // Quién está fuera cada día (solo ausencias APROBADAS, no las pendientes).
  const off = new Map(); // iso → Set(nombre)
  for (const e of events) {
    if ((e.type !== "vacaciones" && e.type !== "ausencia") || e.pending || !e.who || !e.start) continue;
    eachDayISO(e.start, e.end || e.start, (k) => {
      if (!off.has(k)) off.set(k, new Set());
      off.get(k).add(e.who);
    });
  }
  if (!off.size) return [];

  const out = [];
  const seen = new Set(); // taskId|person (una entrada por persona y tarea)
  for (const t of tasks) {
    if (!t.dueDate) continue;
    if (t.statusType === "closed" || t.statusType === "done") continue; // cerradas no cuentan
    if (t.everyone) continue; // tareas de "Team" (toda la plantilla) no se marcan
    const quien = (t.assignees || []).map((a) => a.name).filter(Boolean);
    if (!quien.length) continue;
    const endISO = isoFromMs(t.dueDate);
    const startISO = t.startDate && t.startDate < t.dueDate ? isoFromMs(t.startDate) : endISO;
    eachDayISO(startISO, endISO, (k) => {
      const fuera = off.get(k);
      if (!fuera) return;
      for (const person of quien) {
        if (!fuera.has(person)) continue;
        const key = `${t.id}|${person}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ taskId: t.id, taskName: t.name, url: t.url || null, person, date: k });
      }
    });
  }
  // Más próximas primero.
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
