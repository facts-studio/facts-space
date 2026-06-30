"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addEntry, voidEntry, autofillTime } from "@/lib/actions/time";
import { madridTime, formatDuration } from "@/lib/dates";

const durMs = (e) => (e.clock_out ? new Date(e.clock_out) - new Date(e.clock_in) : 0);

function fmtDayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const s = new Date(y, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const field = "h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-ink outline-none focus:border-borderStrong";

export default function FichajeClient({ entries, month, todayISO }) {
  const router = useRouter();

  // ── Resúmenes
  const monthMs = useMemo(() => entries.reduce((s, e) => s + durMs(e), 0), [entries]);
  const weekStartISO = useMemo(() => {
    const t = new Date(todayISO + "T00:00:00");
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, [todayISO]);
  const weekMs = useMemo(
    () => entries.filter((e) => e.work_date >= weekStartISO && e.work_date <= todayISO).reduce((s, e) => s + durMs(e), 0),
    [entries, weekStartISO, todayISO]
  );

  // ── Agrupar por día (desc)
  const days = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      if (!map.has(e.work_date)) map.set(e.work_date, []);
      map.get(e.work_date).push(e);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  // ── Navegación de meses
  const [yy, mmStr] = month.split("-");
  const monthLabel = new Date(+yy, +mmStr - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const shift = (delta) => {
    const d = new Date(+yy, +mmStr - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Resúmenes */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Esta semana" value={formatDuration(weekMs)} />
        <Stat label={monthLabel} value={formatDuration(monthMs)} capitalize />
        <Stat label="Jornadas registradas" value={String(entries.length)} />
      </div>

      {/* Formularios */}
      <div className="grid lg:grid-cols-2 gap-3">
        <ManualForm todayISO={todayISO} onDone={() => router.refresh()} />
        <AutofillForm month={month} todayISO={todayISO} onDone={() => router.refresh()} />
      </div>

      {/* Historial */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-ink capitalize">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <a href={`/api/fichaje/export?month=${month}`} className="text-small text-muted hover:text-ink transition mr-2">↓ CSV</a>
            <Link href={`/fichaje?month=${shift(-1)}`} className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:bg-surface2/60 transition" aria-label="Mes anterior">‹</Link>
            <Link href={`/fichaje?month=${shift(1)}`} className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:bg-surface2/60 transition" aria-label="Mes siguiente">›</Link>
          </div>
        </div>

        {days.length === 0 ? (
          <div className="rounded-2xl border border-borderStrong/40 px-4 py-12 text-center text-[13px] text-mutedSoft">
            Sin fichajes este mes
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {days.map(([d, list]) => {
              const total = list.reduce((s, e) => s + durMs(e), 0);
              return (
                <li key={d} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-small text-ink capitalize">{fmtDayLabel(d)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {list.map((e) => (
                        <EntryChip key={e.id} entry={e} onDone={() => router.refresh()} />
                      ))}
                    </div>
                  </div>
                  <span className="text-small text-ink tabular-nums shrink-0 pt-0.5">{formatDuration(total)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, capitalize }) {
  return (
    <div className="card p-5">
      <p className={`section-eyebrow mb-2 ${capitalize ? "capitalize" : ""}`}>{label}</p>
      <p className="font-display text-[26px] leading-none text-ink tabular-nums">{value}</p>
    </div>
  );
}

function EntryChip({ entry, onDone }) {
  const [pending, start] = useTransition();
  const remove = () =>
    start(async () => {
      const res = await voidEntry(entry.id);
      if (res.ok) onDone();
    });
  return (
    <span className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface2/40 pl-2.5 pr-1.5 py-1 text-micro text-ink tabular-nums">
      {madridTime(entry.clock_in)}–{entry.clock_out ? madridTime(entry.clock_out) : "—"}
      <button onClick={remove} disabled={pending} aria-label="Anular" className="h-4 w-4 grid place-items-center rounded-full text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
    </span>
  );
}

function ManualForm({ todayISO, onDone }) {
  const [date, setDate] = useState(todayISO);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();
  const submit = () => {
    setMsg(null);
    run(async () => {
      const res = await addEntry({ date, start, end });
      if (res.ok) { setMsg({ ok: true, text: "Fichaje añadido." }); onDone(); }
      else setMsg({ ok: false, text: res.error });
    });
  };
  return (
    <div className="card p-6">
      <p className="section-eyebrow mb-3">Añadir fichaje</p>
      <div className="flex flex-wrap items-end gap-2">
        <Labeled label="Día"><input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></Labeled>
        <Labeled label="Entrada"><input type="time" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></Labeled>
        <Labeled label="Salida"><input type="time" className={field} value={end} onChange={(e) => setEnd(e.target.value)} /></Labeled>
        <button onClick={submit} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">{pending ? "…" : "Añadir"}</button>
      </div>
      {msg && <p className={`text-micro mt-2 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </div>
  );
}

function AutofillForm({ month, todayISO, onDone }) {
  const [fromDate, setFromDate] = useState(`${month}-01`);
  const [toDate, setToDate] = useState(todayISO);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();
  const submit = () => {
    setMsg(null);
    run(async () => {
      const res = await autofillTime({ fromDate, toDate, start, end });
      if (res.ok) { setMsg({ ok: true, text: `Añadidos ${res.count} días (saltados findes, festivos, cumpleaños y vacaciones).` }); onDone(); }
      else setMsg({ ok: false, text: res.error });
    });
  };
  return (
    <div className="card p-6">
      <p className="section-eyebrow mb-3">Autorrellenar</p>
      <div className="flex flex-wrap items-end gap-2">
        <Labeled label="Desde"><input type="date" className={field} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Labeled>
        <Labeled label="Hasta"><input type="date" className={field} value={toDate} onChange={(e) => setToDate(e.target.value)} /></Labeled>
        <Labeled label="Entrada"><input type="time" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></Labeled>
        <Labeled label="Salida"><input type="time" className={field} value={end} onChange={(e) => setEnd(e.target.value)} /></Labeled>
        <button onClick={submit} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">{pending ? "…" : "Rellenar"}</button>
      </div>
      <p className="text-micro text-mutedSoft mt-2 leading-snug">Rellena los días sin fichar con ese horario, saltando findes, festivos, tu cumpleaños y tus vacaciones aprobadas.</p>
      {msg && <p className={`text-micro mt-1.5 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-micro text-mutedSoft">{label}</span>
      {children}
    </label>
  );
}
