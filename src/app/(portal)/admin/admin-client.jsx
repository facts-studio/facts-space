"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decideVacation } from "@/lib/actions/vacations";
import { updateEmployee, validateMonth, addCalendarEvent, deleteCalendarEvent } from "@/lib/actions/admin";
import { fmtRange } from "@/lib/mock";
import { formatDuration } from "@/lib/dates";
import { absenceLabel } from "@/lib/absences";

const TABS = [
  ["aprobaciones", "Aprobaciones"],
  ["equipo", "Equipo"],
  ["calendario", "Calendario"],
  ["informes", "Informes"],
];

export default function AdminClient({ employees, pending, recent, timeStats, vacUsed, calendarEvents = [], timeHours = {}, month, year }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [tab, setTab] = useState("aprobaciones");
  const nameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);

  return (
    <div className="space-y-3">
      <div className="flex items-center bg-surface2/60 rounded-lg p-0.5 w-fit">
        {TABS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] transition ${tab === v ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"}`}
          >
            {l}
            {v === "aprobaciones" && pending.length > 0 && (
              <span className="ml-1.5 text-micro text-warn">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "aprobaciones" && (
        <div className="space-y-3">
          <Solicitudes pending={pending} recent={recent} nameById={nameById} onDone={refresh} />
          <Fichaje employees={employees} timeStats={timeStats} month={month} onDone={refresh} />
        </div>
      )}
      {tab === "equipo" && <Equipo employees={employees} vacUsed={vacUsed} year={year} onDone={refresh} />}
      {tab === "calendario" && <Calendario events={calendarEvents} year={year} onDone={refresh} />}
      {tab === "informes" && <Informes employees={employees} vacUsed={vacUsed} timeHours={timeHours} month={month} year={year} />}
    </div>
  );
}

// ── Calendario laboral (festivos / hitos) ────────────────────────────────────
function Calendario({ events, year, onDone }) {
  const [type, setType] = useState("festivo");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(`${year}-01-01`);
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();
  const add = () => {
    setMsg(null);
    run(async () => {
      const res = await addCalendarEvent({ type, title, startDate: date });
      if (res.ok) { setTitle(""); onDone(); } else setMsg({ ok: false, text: res.error });
    });
  };
  const del = (id) => run(async () => { const r = await deleteCalendarEvent(id); if (r.ok) onDone(); });
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Añadir al calendario {year}</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Tipo">
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink">
              <option value="festivo">Festivo</option>
              <option value="hito">Hito</option>
            </select>
          </Field>
          <Field label="Fecha"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink" /></Field>
          <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p. ej. La Mercè" className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink min-w-[180px]" /></Field>
          <button onClick={add} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">Añadir</button>
        </div>
        {msg && <p className="text-micro text-danger mt-2">{msg.text}</p>}
      </div>
      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Festivos y hitos · {year}</p>
        {events.length === 0 ? (
          <p className="text-small text-mutedSoft">Nada todavía.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-small text-ink">{e.title}</span>
                <span className="flex items-center gap-3">
                  <span className="text-micro text-mutedSoft tabular-nums">{fmtRange(e.start_date, e.end_date)}</span>
                  <span className="text-micro text-mutedSoft w-[60px]">{e.type === "festivo" ? "Festivo" : "Hito"}</span>
                  <button onClick={() => del(e.id)} disabled={pending} className="h-7 w-7 grid place-items-center rounded-lg text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Informes ─────────────────────────────────────────────────────────────────
function Informes({ employees, vacUsed, timeHours, month, year }) {
  const monthLabel = new Date(+month.slice(0, 4), +month.slice(5) - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const rows = employees.filter((e) => e.active).map((e) => {
    const used = vacUsed[e.id] || 0;
    const allowance = Number(e.vacation_allowance);
    const hoursMs = timeHours[e.id] || 0;
    return { name: e.name, used, allowance, remaining: allowance - used, hours: hoursMs / 3600000 };
  });
  const exportCsv = () => {
    const header = ["Empleado", `Vacaciones usadas ${year}`, "Vacaciones restantes", "Asignadas", `Horas ${month}`];
    const lines = rows.map((r) => [r.name, r.used, r.remaining, r.allowance, r.hours.toFixed(2).replace(".", ",")]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c)}"`).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `informe-${month}.csv`;
    a.click();
  };
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-eyebrow capitalize">Resumen · vacaciones {year} · horas {monthLabel}</p>
        <button onClick={exportCsv} className="text-small text-muted hover:text-ink transition">↓ CSV</button>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 px-1 pb-1.5 text-micro uppercase tracking-wide text-mutedSoft">
          <span className="flex-1">Persona</span>
          <span className="w-[120px] text-right">Vac. restantes</span>
          <span className="w-[110px] text-right">Vac. usadas</span>
          <span className="w-[110px] text-right">Horas mes</span>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-surface2/40 transition">
            <span className="flex-1 text-small text-ink">{r.name}</span>
            <span className="w-[120px] text-right text-small tabular-nums text-ink">{r.remaining} <span className="text-mutedSoft">/ {r.allowance}</span></span>
            <span className="w-[110px] text-right text-small tabular-nums text-mutedSoft">{r.used}</span>
            <span className="w-[110px] text-right text-small tabular-nums text-mutedSoft">{formatDuration(r.hours * 3600000)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-micro text-mutedSoft">{label}</span>
      {children}
    </label>
  );
}

// ── Solicitudes de vacaciones ────────────────────────────────────────────────
function Solicitudes({ pending, recent, nameById, onDone }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Pendientes de aprobar</p>
        {pending.length === 0 ? (
          <p className="text-small text-mutedSoft">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((r) => (
              <PendingRow key={r.id} r={r} who={nameById.get(r.employee_id)} onDone={onDone} />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Resueltas recientemente</p>
        {recent.length === 0 ? (
          <p className="text-small text-mutedSoft">Nada todavía.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-small text-ink">{nameById.get(r.employee_id)}</span>
                <span className="text-micro text-muted tabular-nums">{fmtRange(r.start_date, r.end_date)}</span>
                <StatusPill status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PendingRow({ r, who, onDone }) {
  const [pending, run] = useTransition();
  const decide = (approve) => run(async () => { const res = await decideVacation({ id: r.id, approve }); if (res.ok) onDone(); });
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-surface2/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-small text-ink">{who} <span className="text-mutedSoft font-normal">· {absenceLabel(r.type)}</span></p>
        <p className="text-micro text-mutedSoft">
          {fmtRange(r.start_date, r.end_date)} · {Number(r.working_days)} laborables{r.note ? ` · ${r.note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => decide(false)} disabled={pending} className="btn-ghost h-8 text-[12.5px]">Rechazar</button>
        <button onClick={() => decide(true)} disabled={pending} className="btn-primary h-8 text-[12.5px]">Aprobar</button>
      </div>
    </li>
  );
}

// ── Equipo ───────────────────────────────────────────────────────────────────
function Equipo({ employees, vacUsed, year }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-eyebrow">Equipo · saldo de vacaciones {year}</p>
        <span className="text-micro text-mutedSoft">Abre una persona para ver y gestionar su ficha</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 px-3 pb-1.5 text-micro uppercase tracking-wide text-mutedSoft">
          <span className="flex-1">Persona</span>
          <span className="w-[90px] text-right">Saldo</span>
          <span className="w-[50px]" />
          <span className="w-[10px]" />
        </div>
        {employees.map((e) => (
          <EmployeeRow key={e.id} e={e} used={vacUsed[e.id] || 0} />
        ))}
      </div>
    </div>
  );
}

function EmployeeRow({ e, used }) {
  const remaining = Number(e.vacation_allowance) - used;
  return (
    <Link
      href={`/admin/${e.id}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface2/40 transition ${e.active ? "" : "opacity-50"}`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {e.photo ? <img src={e.photo} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="w-7 h-7 rounded-full bg-surface2" />}
        <div className="min-w-0">
          <p className="text-small text-ink truncate">{e.name}</p>
          <p className="text-micro text-mutedSoft truncate">{e.role || "—"}</p>
        </div>
      </div>
      <span className="w-[90px] text-right text-small tabular-nums text-ink">{remaining} <span className="text-mutedSoft">/ {Number(e.vacation_allowance)}</span></span>
      {e.is_admin && <span className="text-micro text-mutedSoft w-[50px] text-center">Admin</span>}
      {!e.is_admin && <span className="w-[50px]" />}
      <span className="text-mutedSoft">›</span>
    </Link>
  );
}

// ── Fichaje ──────────────────────────────────────────────────────────────────
function Fichaje({ employees, timeStats, month, onDone }) {
  const monthLabel = new Date(+month.slice(0, 4), +month.slice(5) - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-4 capitalize">Registro horario · {monthLabel}</p>
      <div className="flex flex-col gap-1.5">
        {employees.filter((e) => e.active).map((e) => {
          const s = timeStats[e.id] || { total: 0, pending: 0 };
          return <FichajeRow key={e.id} e={e} stats={s} month={month} onDone={onDone} />;
        })}
      </div>
    </div>
  );
}

function FichajeRow({ e, stats, month, onDone }) {
  const [pending, run] = useTransition();
  const validate = () => run(async () => { const res = await validateMonth({ employeeId: e.id, month }); if (res.ok) onDone(); });
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface2/40 transition">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {e.photo ? <img src={e.photo} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="w-7 h-7 rounded-full bg-surface2" />}
        <p className="text-small text-ink truncate">{e.name}</p>
      </div>
      <span className="text-micro text-mutedSoft tabular-nums w-[150px] text-right">
        {stats.total} jornadas{stats.pending > 0 ? ` · ${stats.pending} pendientes` : ""}
      </span>
      <a href={`/api/fichaje/export?month=${month}&employee=${e.id}`} className="text-[12.5px] text-muted hover:text-ink transition w-[50px] text-center">CSV</a>
      <button onClick={validate} disabled={pending || stats.pending === 0} className="btn-ghost h-8 text-[12.5px] disabled:opacity-40 w-[110px]">
        {stats.pending === 0 ? "Validado" : "Validar mes"}
      </button>
    </div>
  );
}

// ── Util ─────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    approved: ["Aprobada", "bg-successSoft/60 text-success"],
    rejected: ["Rechazada", "bg-dangerSoft/60 text-danger"],
    cancelled: ["Cancelada", "bg-surface2 text-muted"],
  };
  const [label, cls] = map[status] || [status, "bg-surface2 text-muted"];
  return <span className={`rounded-full px-2.5 py-0.5 text-micro font-medium ${cls}`}>{label}</span>;
}
