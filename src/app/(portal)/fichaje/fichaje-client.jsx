"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addEntry, voidEntry, autofillTime } from "@/lib/actions/time";
import { madridTime, madridMinutes, formatDuration } from "@/lib/dates";

const durMs = (e) => (e.clock_out ? new Date(e.clock_out) - new Date(e.clock_in) : 0);

// Ventana del día para la barra de horario (06:00–22:00).
const WIN_START = 6 * 60;
const WIN_SPAN = 16 * 60;
const clamp = (n) => Math.max(0, Math.min(100, n));

function monthDaysISO(month) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return Array.from({ length: last }, (_, i) => {
    const d = new Date(y, m - 1, i + 1);
    return { iso: `${month}-${String(i + 1).padStart(2, "0")}`, dow: d.getDay() };
  });
}

function dayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(y, m - 1, d).toLocaleDateString("es-ES", { weekday: "short" });
  return `${wd.charAt(0).toUpperCase() + wd.slice(1).replace(".", "")} ${d}`;
}

const PILL = {
  pending: "bg-warnSoft/60 text-warn",
  validated: "bg-successSoft/60 text-success",
  festivo: "bg-successSoft/60 text-success",
  vacaciones: "bg-warnSoft/60 text-warn",
  cumple: "bg-infoSoft/60 text-info",
};

export default function FichajeClient({ entries, festivos = [], vacaciones = [], birthday, todayISO, month, missing = [] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  // Estado del formulario (elevado para que las acciones rápidas lo prefijen).
  const [mode, setMode] = useState("manual");
  const [date, setDate] = useState(todayISO);
  const [fromDate, setFromDate] = useState(missing[0] || `${month}-01`);
  const [toDate, setToDate] = useState(todayISO);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const cardRef = useRef(null);

  const ficharDay = (iso) => {
    setMode("manual");
    setDate(iso);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const autofillFrom = (iso) => {
    setMode("auto");
    setFromDate(iso);
    setToDate(todayISO);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Resúmenes
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

  // Índices para clasificar el día
  const byDay = useMemo(() => {
    const m = new Map();
    for (const e of entries) {
      if (!m.has(e.work_date)) m.set(e.work_date, []);
      m.get(e.work_date).push(e);
    }
    return m;
  }, [entries]);
  const fset = useMemo(() => new Set(festivos), [festivos]);
  const vset = useMemo(() => new Set(vacaciones), [vacaciones]);
  const bday = birthday ? birthday.slice(5) : null;

  const currentMonth = todayISO.slice(0, 7);
  const isFutureMonth = month > currentMonth;
  const lastISO = month === currentMonth ? todayISO : `${month}-31`;
  const allDays = isFutureMonth ? [] : monthDaysISO(month).filter((d) => d.iso <= lastISO).reverse();

  const [yy, mmStr] = month.split("-");
  const monthLabel = new Date(+yy, +mmStr - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const shift = (delta) => {
    const d = new Date(+yy, +mmStr - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Días sin fichar */}
      {missing.length > 0 && (
        <div className="rounded-2xl bg-warnSoft/30 p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-small text-ink">
            Llevas <b>{missing.length}</b> {missing.length === 1 ? "día laborable" : "días laborables"} sin fichar
            <span className="text-mutedSoft"> · desde el {dayLabel(missing[0])}</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => ficharDay(missing[missing.length - 1])} className="btn-ghost h-8 text-[12.5px]">Fichar uno</button>
            <button onClick={() => autofillFrom(missing[0])} className="btn-primary h-8 text-[12.5px]">Autorrellenar todos</button>
          </div>
        </div>
      )}

      {/* Resúmenes */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Esta semana" value={formatDuration(weekMs)} />
        <Stat label={monthLabel} value={formatDuration(monthMs)} capitalize />
        <Stat label="Jornadas registradas" value={String(entries.length)} />
      </div>

      {/* Fichar (manual / autorrellenar) */}
      <div ref={cardRef}>
        <FicharCard
          {...{ mode, setMode, date, setDate, fromDate, setFromDate, toDate, setToDate, start, setStart, end, setEnd }}
          onDone={refresh}
        />
      </div>

      {/* Historial */}
      <div className="rounded-2xl bg-surface/55 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-ink capitalize">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <a href={`/api/fichaje/export?month=${month}`} className="text-small text-muted hover:text-ink transition mr-2">↓ CSV</a>
            <Link href={`/fichaje?month=${shift(-1)}`} className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:bg-surface2/60 transition" aria-label="Mes anterior">‹</Link>
            <Link href={`/fichaje?month=${shift(1)}`} className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:bg-surface2/60 transition" aria-label="Mes siguiente">›</Link>
          </div>
        </div>

        {/* Cabecera de columnas */}
        <div className="flex items-center gap-4 px-1 pb-2 text-micro uppercase tracking-wide text-mutedSoft border-b border-border/60">
          <span className="w-[110px] shrink-0">Día</span>
          <span className="flex-1">Horario</span>
          <span className="w-[90px] shrink-0 text-right">Horas</span>
          <span className="w-[120px] shrink-0 text-right">Estado</span>
        </div>

        {allDays.length === 0 ? (
          <div className="rounded-2xl bg-surface2/40 px-4 py-12 text-center text-[13px] text-mutedSoft mt-3">
            Nada que mostrar
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {allDays.map(({ iso, dow }) => {
              const list = byDay.get(iso) || [];
              let kind;
              if (list.length) kind = "worked";
              else if (fset.has(iso)) kind = "festivo";
              else if (vset.has(iso)) kind = "vacaciones";
              else if (bday && iso.slice(5) === bday) kind = "cumple";
              else if (dow === 0 || dow === 6) kind = "weekend";
              else kind = "pending";
              return (
                <DayRow key={iso} iso={iso} kind={kind} entries={list} onFichar={() => ficharDay(iso)} onDone={refresh} />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DayRow({ iso, kind, entries, onFichar, onDone }) {
  const [pending, run] = useTransition();
  const total = entries.reduce((s, e) => s + durMs(e), 0);
  const status = entries.length && entries.every((e) => e.status === "validated") ? "validated" : "pending";

  const anular = (id) => run(async () => { const r = await voidEntry(id); if (r.ok) onDone(); });

  const muted = kind === "weekend";
  return (
    <li className={`flex items-center gap-4 py-2.5 ${muted ? "opacity-45" : ""}`}>
      <span className="w-[110px] shrink-0 text-small text-ink">{dayLabel(iso)}</span>

      {/* Horario */}
      <div className="flex-1 min-w-0">
        {kind === "worked" ? (
          <div className="relative h-3 rounded-full bg-surface2/70 overflow-hidden">
            {entries.map((e) => {
              const s = madridMinutes(e.clock_in);
              const en = e.clock_out ? madridMinutes(e.clock_out) : s;
              return (
                <span
                  key={e.id}
                  className="absolute top-0 h-full rounded-full bg-ink/75"
                  style={{ left: `${clamp(((s - WIN_START) / WIN_SPAN) * 100)}%`, width: `${clamp(((en - s) / WIN_SPAN) * 100)}%` }}
                  title={`${madridTime(e.clock_in)}–${e.clock_out ? madridTime(e.clock_out) : "—"}`}
                />
              );
            })}
          </div>
        ) : kind === "pending" ? (
          <button onClick={onFichar} className="text-[12.5px] text-ink/70 hover:text-ink underline underline-offset-2 decoration-borderStrong">+ Fichar este día</button>
        ) : (
          <span className="text-micro text-mutedSoft">
            {kind === "festivo" ? "Festivo" : kind === "vacaciones" ? "Vacaciones" : kind === "cumple" ? "Cumpleaños" : "Fin de semana"}
          </span>
        )}
      </div>

      {/* Horas */}
      <span className="w-[90px] shrink-0 text-right text-small tabular-nums text-ink">
        {kind === "worked" ? formatDuration(total) : "—"}
      </span>

      {/* Estado */}
      <span className="w-[120px] shrink-0 flex items-center justify-end gap-1.5">
        {kind === "worked" ? (
          <>
            <Pill kind={status}>{status === "validated" ? "Validado" : "Pendiente"}</Pill>
            {entries.length === 1 && (
              <button onClick={() => anular(entries[0].id)} disabled={pending} aria-label="Anular" className="h-5 w-5 grid place-items-center rounded-full text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
            )}
          </>
        ) : kind === "pending" ? (
          <Pill kind="pending">Pendiente</Pill>
        ) : kind === "festivo" || kind === "vacaciones" || kind === "cumple" ? (
          <Pill kind={kind}>{kind === "festivo" ? "Festivo" : kind === "vacaciones" ? "Vacaciones" : "Cumpleaños"}</Pill>
        ) : null}
      </span>
    </li>
  );
}

function Pill({ kind, children }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-micro font-medium ${PILL[kind]}`}>{children}</span>;
}

function Stat({ label, value, capitalize }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-5">
      <p className={`section-eyebrow mb-2 ${capitalize ? "capitalize" : ""}`}>{label}</p>
      <p className="font-display text-[26px] leading-none text-ink tabular-nums">{value}</p>
    </div>
  );
}

const fieldCls = "h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-ink outline-none focus:border-borderStrong";

function FicharCard({ mode, setMode, date, setDate, fromDate, setFromDate, toDate, setToDate, start, setStart, end, setEnd, onDone }) {
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();

  const submit = () => {
    setMsg(null);
    run(async () => {
      const res = mode === "manual" ? await addEntry({ date, start, end }) : await autofillTime({ fromDate, toDate, start, end });
      if (res.ok) { setMsg({ ok: true, text: mode === "manual" ? "Fichaje añadido." : `Añadidos ${res.count} días.` }); onDone(); }
      else setMsg({ ok: false, text: res.error });
    });
  };

  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="section-eyebrow">Fichar</p>
        <div className="flex items-center bg-surface2/60 rounded-lg p-0.5">
          {[["manual", "Manual"], ["auto", "Autorrellenar"]].map(([v, l]) => (
            <button key={v} onClick={() => { setMode(v); setMsg(null); }} className={`px-3 py-1 rounded-md text-[12.5px] transition ${mode === v ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {mode === "manual" ? (
          <Labeled label="Día"><input type="date" className={fieldCls} value={date} onChange={(e) => setDate(e.target.value)} /></Labeled>
        ) : (
          <>
            <Labeled label="Desde"><input type="date" className={fieldCls} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Labeled>
            <Labeled label="Hasta"><input type="date" className={fieldCls} value={toDate} onChange={(e) => setToDate(e.target.value)} /></Labeled>
          </>
        )}
        <Labeled label="Entrada"><input type="time" className={fieldCls} value={start} onChange={(e) => setStart(e.target.value)} /></Labeled>
        <Labeled label="Salida"><input type="time" className={fieldCls} value={end} onChange={(e) => setEnd(e.target.value)} /></Labeled>
        <button onClick={submit} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">{pending ? "…" : mode === "manual" ? "Añadir" : "Rellenar"}</button>
      </div>

      {mode === "auto" && (
        <p className="text-micro text-mutedSoft mt-2 leading-snug">Rellena los días sin fichar del rango con ese horario, saltando findes, festivos, tu cumpleaños y tus vacaciones aprobadas.</p>
      )}
      {msg && <p className={`text-micro mt-2 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
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
