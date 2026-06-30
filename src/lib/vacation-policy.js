// Evaluación ORIENTATIVA de una solicitud de vacaciones según la política del
// estudio. No prohíbe nada: solo informa (carga del trimestre, periodos
// bloqueados, antelación y cobertura del equipo). Compartida entre el
// comprobador de políticas y el panel de solicitud del calendario.

const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parse = (iso) => (iso ? new Date(iso + "T00:00:00") : null);

// Días laborables (lun-vie) entre dos fechas, ambas incluidas. Findes no cuentan.
function workingDays(a, b) {
  let n = 0;
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

// Quién más del equipo tiene vacaciones que solapen el rango.
function coverage(events, a, b) {
  const names = new Set();
  for (const e of events) {
    if (e.type !== "vacaciones") continue;
    const s = parse(e.start), en = parse(e.end);
    if (s <= b && en >= a) names.add(e.who);
  }
  return [...names].filter(Boolean);
}

// Devuelve { status: 'ok'|'warn'|'bad', title, natDays, workDays, reasons:[{tone,text}] }
// o null si no hay fecha de inicio.
export function evaluateVacation(startISO, endISO, events = []) {
  const start = parse(startISO);
  if (!start) return null;
  const end = parse(endISO || startISO);
  const today = startOfDay(new Date());

  const natDays = Math.round((startOfDay(end) - startOfDay(start)) / DAY) + 1;
  const workDays = workingDays(start, end);
  const noticeDays = Math.round((startOfDay(start) - today) / DAY);
  const month = start.getMonth();

  const reasons = [];
  let status = "ok";
  const bump = (s) => { if (s === "bad") status = "bad"; else if (s === "warn" && status !== "bad") status = "warn"; };

  if (month === 9 || month === 10) {
    reasons.push({ tone: "bad", text: "Octubre y noviembre están bloqueados (campañas y lanzamientos)." });
    bump("bad");
  } else if (month === 11) {
    const inXmas = start.getDate() >= 20 || end.getDate() >= 20;
    if (inXmas) { reasons.push({ tone: "bad", text: "Evita la semana antes de Navidad (±5 días alrededor del 25 dic)." }); bump("bad"); }
    else if (start.getDate() <= 15) { reasons.push({ tone: "warn", text: "Diciembre: solo la 1ª mitad y sujeto a aprobación si quedan días." }); bump("warn"); }
    else { reasons.push({ tone: "warn", text: "Segunda mitad de diciembre: muy restringida, requiere aprobación." }); bump("warn"); }
  } else if (month >= 3 && month <= 5) {
    if (workDays > 2) { reasons.push({ tone: "bad", text: `Q2 es carga alta: máximo 2 días laborables seguidos (pides ${workDays}).` }); bump("bad"); }
    else { reasons.push({ tone: "warn", text: "Q2 es carga alta: solo ausencias cortas (≤2 días) y sujeto a aprobación." }); bump("warn"); }
  } else {
    reasons.push({ tone: "ok", text: "Trimestre de carga baja: días sueltos y periodos largos permitidos." });
  }

  let needed = workDays <= 3 ? 15 : 30;
  if (workDays > 5) {
    const march15 = new Date(start.getFullYear(), 2, 15);
    if (today > march15) { reasons.push({ tone: "warn", text: "Periodos de +5 días laborables deben comunicarse antes del 15 de marzo." }); bump("warn"); }
    needed = 30;
  }
  if (noticeDays < 0) { reasons.push({ tone: "bad", text: "La fecha de inicio ya ha pasado." }); bump("bad"); }
  else if (noticeDays < needed) { reasons.push({ tone: "bad", text: `Antelación insuficiente: ${noticeDays} días (se piden ${needed}).` }); bump("bad"); }
  else { reasons.push({ tone: "ok", text: `Antelación correcta: ${noticeDays} días (≥ ${needed}).` }); }

  const off = coverage(events, start, end);
  if (off.length >= 2) { reasons.push({ tone: "warn", text: `${off.join(", ")} ya tienen vacaciones esos días: revisa la cobertura.` }); bump("warn"); }
  else if (off.length === 1) reasons.push({ tone: "ok", text: `Solo ${off[0]} coincide esos días.` });
  else reasons.push({ tone: "ok", text: "Nadie más del equipo está fuera esos días." });

  const titles = {
    ok: "Sin impedimentos previstos",
    warn: "Puede haber impedimentos",
    bad: "Difícil de aprobar",
  };
  return { status, title: titles[status], natDays, workDays, reasons };
}
