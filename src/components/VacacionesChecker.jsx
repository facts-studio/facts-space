"use client";

import { useMemo, useState } from "react";
import { EVENTS } from "@/lib/mock";

const DAY = 86400000;
const parse = (iso) => (iso ? new Date(iso + "T00:00:00") : null);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmt = (d) => d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });

// Días laborables (L–V) entre dos fechas, ambos incluidos.
function workingDays(a, b) {
  let n = 0;
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

// Personas del equipo de vacaciones que solapan el rango pedido.
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

function evaluate(startISO, endISO) {
  const start = parse(startISO);
  const end = parse(endISO) || start;
  if (!start) return null;
  if (end < start) return { status: "bad", title: "Rango no válido", reasons: [{ tone: "bad", text: "La fecha de fin es anterior a la de inicio." }] };

  const today = startOfDay(new Date());
  const natDays = Math.round((startOfDay(end) - startOfDay(start)) / DAY) + 1;
  const workDays = workingDays(start, end);
  const noticeDays = Math.round((startOfDay(start) - today) / DAY);
  const month = start.getMonth(); // 0–11
  const reasons = [];
  let status = "ok";
  const bump = (s) => { if (s === "bad") status = "bad"; else if (s === "warn" && status !== "bad") status = "warn"; };

  // ── Periodo / carga por trimestre ──
  if (month === 9 || month === 10) {
    reasons.push({ tone: "bad", text: "Octubre y noviembre están bloqueados (campañas y lanzamientos)." });
    bump("bad");
  } else if (month === 11) {
    const inXmas = start.getDate() >= 20 || end.getDate() >= 20;
    if (inXmas) {
      reasons.push({ tone: "bad", text: "Evita la semana antes de Navidad (±5 días alrededor del 25 dic)." });
      bump("bad");
    } else if (start.getDate() <= 15) {
      reasons.push({ tone: "warn", text: "Diciembre: solo la 1ª mitad y sujeto a aprobación si quedan días." });
      bump("warn");
    } else {
      reasons.push({ tone: "warn", text: "Segunda mitad de diciembre: muy restringida, requiere aprobación." });
      bump("warn");
    }
  } else if (month >= 3 && month <= 5) {
    // Q2 — carga alta
    if (workDays > 2) {
      reasons.push({ tone: "bad", text: `Q2 es carga alta: máximo 2 días laborables seguidos (pides ${workDays}).` });
      bump("bad");
    } else {
      reasons.push({ tone: "warn", text: "Q2 es carga alta: solo ausencias cortas (≤2 días) y sujeto a aprobación." });
      bump("warn");
    }
  } else {
    reasons.push({ tone: "ok", text: "Trimestre de carga baja: días sueltos y periodos largos permitidos." });
  }

  // ── Antelación ──
  let needed = natDays <= 3 ? 15 : 30;
  if (natDays > 5) {
    const march15 = new Date(start.getFullYear(), 2, 15);
    if (today > march15) {
      reasons.push({ tone: "warn", text: "Periodos de +5 días deben comunicarse antes del 15 de marzo." });
      bump("warn");
    }
    needed = 30;
  }
  if (noticeDays < 0) {
    reasons.push({ tone: "bad", text: "La fecha de inicio ya ha pasado." });
    bump("bad");
  } else if (noticeDays < needed) {
    reasons.push({ tone: "bad", text: `Antelación insuficiente: ${noticeDays} días (se piden ${needed}).` });
    bump("bad");
  } else {
    reasons.push({ tone: "ok", text: `Antelación correcta: ${noticeDays} días (≥ ${needed}).` });
  }

  // ── Cobertura del equipo ──
  const off = coverage(start, end);
  if (off.length >= 2) {
    reasons.push({ tone: "warn", text: `${off.join(", ")} ya tienen vacaciones esos días: revisa la cobertura.` });
    bump("warn");
  } else if (off.length === 1) {
    reasons.push({ tone: "ok", text: `Solo ${off[0]} coincide esos días.` });
  } else {
    reasons.push({ tone: "ok", text: "Nadie más del equipo está fuera esos días." });
  }

  const titles = {
    ok: "Viable 🎉",
    warn: "Viable con condiciones",
    bad: "No recomendable",
  };
  return { status, title: titles[status], natDays, workDays, reasons };
}

export default function VacacionesChecker() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const result = useMemo(() => (start ? evaluate(start, end) : null), [start, end]);

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="section-eyebrow mb-1.5">Comprobador</h2>
      <p className="font-display text-[22px] text-ink mb-1">¿Puedo pedir estos días?</p>
      <p className="text-small text-muted mb-5 max-w-[48ch]">Introduce las fechas y te decimos si es viable según la política (carga del trimestre, periodos bloqueados, antelación y cobertura del equipo).</p>

      <div className="grid sm:grid-cols-2 gap-3 max-w-[440px]">
        <label className="block">
          <span className="text-micro uppercase tracking-[0.1em] text-mutedSoft">Desde</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input mt-1.5" />
        </label>
        <label className="block">
          <span className="text-micro uppercase tracking-[0.1em] text-mutedSoft">Hasta (opcional)</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input mt-1.5" />
        </label>
      </div>

      {result && (
        <div className="mt-6 max-w-[560px]">
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`h-2.5 w-2.5 rounded-full ${TONE[result.status].dot}`} />
            <span className={`text-title ${TONE[result.status].text}`}>{result.title}</span>
          </div>
          {result.natDays != null && (
            <p className="text-micro text-mutedSoft mb-4">
              {result.natDays} {result.natDays === 1 ? "día natural" : "días naturales"} · {result.workDays} laborables
            </p>
          )}
          <ul className="flex flex-col gap-2.5">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-small text-inkSoft leading-snug">
                <span className={`mt-[0.15em] shrink-0 ${TONE[r.tone].text}`}>
                  {r.tone === "ok" ? "✓" : r.tone === "warn" ? "!" : "✕"}
                </span>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
          <p className="text-micro text-mutedSoft mt-5 leading-relaxed">
            Orientativo. La aprobación final depende del responsable de área según la carga real.
          </p>
        </div>
      )}
    </section>
  );
}
