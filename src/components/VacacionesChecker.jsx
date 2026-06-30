"use client";

import { useMemo, useState } from "react";
import { EVENTS } from "@/lib/mock";

const DAY = 86400000;
const WD = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => (s ? new Date(s + "T00:00:00") : null);
const fmt = (d) => d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });

function workingDays(a, b) {
  let n = 0;
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}
function coverage(a, b) {
  const names = new Set();
  for (const e of EVENTS) {
    if (e.type !== "vacaciones") continue;
    const s = parse(e.start), en = parse(e.end);
    if (s <= b && en >= a) names.add(e.who);
  }
  return [...names];
}

const TONE = {
  ok: { dot: "bg-success", text: "text-success" },
  warn: { dot: "bg-warn", text: "text-warn" },
  bad: { dot: "bg-danger", text: "text-danger" },
};
// Banner de estado del veredicto (fondo suave por color).
const STATUS = {
  ok: { bg: "bg-successSoft/50", dot: "bg-success", text: "text-success" },
  warn: { bg: "bg-warnSoft/45", dot: "bg-warn", text: "text-warn" },
  bad: { bg: "bg-dangerSoft/45", dot: "bg-danger", text: "text-danger" },
};

function evaluate(start, end) {
  if (!start) return null;
  end = end || start;
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

  let needed = natDays <= 3 ? 15 : 30;
  if (natDays > 5) {
    const march15 = new Date(start.getFullYear(), 2, 15);
    if (today > march15) { reasons.push({ tone: "warn", text: "Periodos de +5 días deben comunicarse antes del 15 de marzo." }); bump("warn"); }
    needed = 30;
  }
  if (noticeDays < 0) { reasons.push({ tone: "bad", text: "La fecha de inicio ya ha pasado." }); bump("bad"); }
  else if (noticeDays < needed) { reasons.push({ tone: "bad", text: `Antelación insuficiente: ${noticeDays} días (se piden ${needed}).` }); bump("bad"); }
  else { reasons.push({ tone: "ok", text: `Antelación correcta: ${noticeDays} días (≥ ${needed}).` }); }

  const off = coverage(start, end);
  if (off.length >= 2) { reasons.push({ tone: "warn", text: `${off.join(", ")} ya tienen vacaciones esos días: revisa la cobertura.` }); bump("warn"); }
  else if (off.length === 1) reasons.push({ tone: "ok", text: `Solo ${off[0]} coincide esos días.` });
  else reasons.push({ tone: "ok", text: "Nadie más del equipo está fuera esos días." });

  const titles = { ok: "Viable 🎉", warn: "Viable con condiciones", bad: "No recomendable" };
  return { status, title: titles[status], natDays, workDays, reasons };
}

function gridDays(y, m) {
  const off = (new Date(y, m, 1).getDay() + 6) % 7;
  const start = new Date(y, m, 1 - off);
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

export default function VacacionesChecker() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = gridDays(year, month);
  const result = useMemo(() => evaluate(start, end), [start, end]);

  const pick = (d) => {
    const day = startOfDay(d);
    if (!start || (start && end)) { setStart(day); setEnd(null); }
    else if (day >= start) setEnd(day);
    else { setStart(day); setEnd(null); }
  };

  return (
    <section className="mt-12">
      <div className="rounded-2xl bg-surface/55 p-6 md:p-8">
        {/* Cabecera del módulo */}
        <header className="mb-6">
          <p className="section-eyebrow mb-1.5">Comprobador de vacaciones</p>
          <h2 className="font-display text-[22px] text-ink">¿Puedo pedir estos días?</h2>
          <p className="text-small text-muted mt-1 max-w-[60ch]">Elige las fechas y comprobamos la viabilidad según la política: carga del trimestre, periodos bloqueados, antelación y cobertura del equipo.</p>
        </header>

        <div className="grid lg:grid-cols-[300px_1fr] gap-7 lg:gap-9 items-start">
          {/* Selector de calendario */}
          <div className="rounded-lg bg-bg border border-border p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-[17px] text-ink capitalize">{MESES[month]} <span className="text-mutedSoft text-[14px] tabular-nums">{year}</span></span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-2.5 py-1 rounded-lg text-[12px] text-inkSoft hover:bg-surface2/60 transition">Hoy</button>
              <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface2/60 transition">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface2/60 transition">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WD.map((w) => <div key={w} className="text-center text-[11px] text-mutedSoft py-1">{w}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {days.map((d, i) => {
              const inM = d.getMonth() === month;
              const t = d.getTime();
              const isStart = start && t === start.getTime();
              const isEnd = end ? t === end.getTime() : isStart;
              const between = start && end && t > start.getTime() && t < end.getTime();
              const isToday = t === today.getTime();
              const endpoint = isStart || isEnd;
              const col = i % 7;
              return (
                <div
                  key={i}
                  className={`h-9 flex items-center justify-center ${between ? "bg-surface2" : ""} ${
                    between && (col === 0 || d.getDate() === 1) ? "rounded-l-md" : ""
                  } ${between && (col === 6) ? "rounded-r-md" : ""}`}
                >
                  <button
                    onClick={() => pick(d)}
                    className={`h-9 w-9 rounded-md text-[13px] tabular-nums transition ${
                      !inM ? "text-mutedSoft/40"
                        : endpoint ? "bg-ink text-bg font-semibold"
                        : between ? "text-ink"
                        : isToday ? "bg-surface2/70 text-ink"
                        : "text-ink hover:bg-surface2/60"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          {start && (
            <p className="text-small text-muted mt-3">
              {end && end.getTime() !== start.getTime()
                ? <>Del <span className="text-ink">{fmt(start)}</span> al <span className="text-ink">{fmt(end)}</span></>
                : <><span className="text-ink">{fmt(start)}</span> · elige el día de fin (o déjalo en uno solo)</>}
            </p>
          )}
        </div>

          {/* Veredicto */}
          <div>
            <h3 className="section-eyebrow mb-3">Resultado</h3>
            {!result ? (
              <div className="rounded-lg border border-dashed border-borderStrong/50 px-4 py-10 text-center">
                <p className="text-small text-mutedSoft">Selecciona una o dos fechas en el calendario para ver el veredicto.</p>
              </div>
            ) : (
              <>
                <div className={`rounded-lg px-4 py-3.5 mb-5 ${STATUS[result.status].bg}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS[result.status].dot}`} />
                    <span className={`text-title ${STATUS[result.status].text}`}>{result.title}</span>
                  </div>
                  <p className="text-micro text-ink/70 mt-1">{result.natDays} {result.natDays === 1 ? "día natural" : "días naturales"} · {result.workDays} laborables</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2.5 text-small text-inkSoft leading-snug">
                      <span className={`mt-[0.15em] shrink-0 ${TONE[r.tone].text}`}>{r.tone === "ok" ? "✓" : r.tone === "warn" ? "!" : "✕"}</span>
                      <span>{r.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-micro text-mutedSoft mt-5 leading-relaxed">Orientativo. La aprobación final depende del responsable de área según la carga real.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
