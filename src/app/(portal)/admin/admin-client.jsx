"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideVacation } from "@/lib/actions/vacations";
import { updateEmployee, validateMonth, addCalendarEvent, deleteCalendarEvent } from "@/lib/actions/admin";
import { recordDocument, deleteDocument, getDocumentUrl } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import { fmtRange, fmtDate } from "@/lib/mock";
import { formatDuration } from "@/lib/dates";
import { absenceLabel } from "@/lib/absences";

const TABS = [
  ["aprobaciones", "Aprobaciones"],
  ["equipo", "Equipo"],
  ["documentos", "Documentos"],
  ["calendario", "Calendario"],
  ["informes", "Informes"],
];

export default function AdminClient({ employees, pending, recent, timeStats, vacUsed, documents = [], calendarEvents = [], timeHours = {}, month, year }) {
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
      {tab === "documentos" && <Documentos employees={employees} documents={documents} nameById={nameById} month={month} onDone={refresh} />}
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

// ── Documentos (nóminas, contratos, otros) ───────────────────────────────────
function Documentos({ employees, documents, nameById, month, onDone }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [category, setCategory] = useState("nomina");
  const [period, setPeriod] = useState(month);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();

  const submit = () => {
    setMsg(null);
    if (!employeeId || !file) { setMsg({ ok: false, text: "Elige empleado y archivo." }); return; }
    run(async () => {
      const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${employeeId}/${category}/${Date.now()}-${safe}`;
      const supabase = createClient();
      const up = await supabase.storage.from("hr-docs").upload(path, file, { upsert: false });
      if (up.error) { setMsg({ ok: false, text: up.error.message }); return; }
      const res = await recordDocument({ employeeId, category, title, period: category === "nomina" ? period : "", storagePath: path });
      if (res.ok) { setMsg({ ok: true, text: "Documento subido." }); setFile(null); setTitle(""); onDone(); }
      else setMsg({ ok: false, text: res.error });
    });
  };

  const list = employeeId ? documents.filter((d) => d.employee_id === employeeId) : documents;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Subir documento</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Empleado">
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink min-w-[160px]">
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink">
              <option value="nomina">Nómina</option>
              <option value="contrato">Contrato</option>
              <option value="documento">Documento</option>
            </select>
          </Field>
          {category === "nomina" ? (
            <Field label="Mes"><input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink" /></Field>
          ) : (
            <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p. ej. Contrato 2026" className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink" /></Field>
          )}
          <Field label="Archivo (PDF)"><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[12px] text-muted" /></Field>
          <button onClick={submit} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">{pending ? "Subiendo…" : "Subir"}</button>
        </div>
        {msg && <p className={`text-micro mt-2 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>

      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Documentos {employeeId ? `· ${nameById.get(employeeId)}` : ""}</p>
        {list.length === 0 ? (
          <p className="text-small text-mutedSoft">Sin documentos.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {list.map((d) => <DocRow key={d.id} d={d} who={nameById.get(d.employee_id)} onDone={onDone} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function DocRow({ d, who, onDone }) {
  const [pending, run] = useTransition();
  const open = () => run(async () => { const r = await getDocumentUrl(d.id); if (r.ok) window.open(r.url, "_blank"); });
  const del = () => run(async () => { const r = await deleteDocument(d.id); if (r.ok) onDone(); });
  const label = d.title || (d.category === "nomina" ? `Nómina ${d.period}` : d.category === "contrato" ? "Contrato" : "Documento");
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-small text-ink truncate">{label} <span className="text-mutedSoft font-normal">· {who}</span></p>
        <p className="text-micro text-mutedSoft">{fmtDate(d.created_at.slice(0, 10))}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={open} disabled={pending} className="btn-ghost h-8 text-[12.5px]">Ver</button>
        <button onClick={del} disabled={pending} className="h-8 w-8 grid place-items-center rounded-lg text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
      </div>
    </li>
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
function Equipo({ employees, vacUsed, year, onDone }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-4">Equipo · saldo de vacaciones {year}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 px-1 pb-1.5 text-micro uppercase tracking-wide text-mutedSoft">
          <span className="flex-1">Persona</span>
          <span className="w-[150px]">Responsable</span>
          <span className="w-[80px] text-right">Días/año</span>
          <span className="w-[90px] text-right">Saldo</span>
          <span className="w-[70px] text-center">Admin</span>
        </div>
        {employees.map((e) => (
          <EmployeeRow key={e.id} e={e} employees={employees} used={vacUsed[e.id] || 0} onDone={onDone} />
        ))}
      </div>
    </div>
  );
}

function EmployeeRow({ e, employees, used, onDone }) {
  const [pending, run] = useTransition();
  const [open, setOpen] = useState(false);
  const save = (patch) => run(async () => { await updateEmployee({ id: e.id, patch }); onDone(); });
  const remaining = Number(e.vacation_allowance) - used;
  return (
    <div className={`rounded-xl ${open ? "bg-surface2/40" : "hover:bg-surface2/40"} transition ${e.active ? "" : "opacity-50"}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {e.photo ? <img src={e.photo} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="w-7 h-7 rounded-full bg-surface2" />}
          <div className="min-w-0">
            <p className="text-small text-ink truncate">{e.name}</p>
            <p className="text-micro text-mutedSoft truncate">{e.role || "—"}</p>
          </div>
        </button>
        <select
          defaultValue={e.manager_id || ""}
          onChange={(ev) => save({ manager_id: ev.target.value || null })}
          className="w-[150px] h-8 rounded-lg bg-surface px-2 text-[12.5px] text-ink"
        >
          <option value="">— Sin responsable</option>
          {employees.filter((m) => m.id !== e.id).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input
          type="number"
          defaultValue={Number(e.vacation_allowance)}
          onBlur={(ev) => { const v = Number(ev.target.value); if (v !== Number(e.vacation_allowance)) save({ vacation_allowance: v }); }}
          className="w-[80px] h-8 rounded-lg bg-surface px-2 text-[12.5px] text-ink text-right"
        />
        <span className="w-[90px] text-right text-small tabular-nums text-ink">{remaining} <span className="text-mutedSoft">/ {Number(e.vacation_allowance)}</span></span>
        <span className="w-[70px] text-center">
          <input type="checkbox" defaultChecked={e.is_admin} onChange={(ev) => save({ is_admin: ev.target.checked })} />
        </span>
      </div>

      {open && <FichaEditor e={e} pending={pending} onSave={save} />}
    </div>
  );
}

const FICHA_FIELDS = [
  ["role", "Puesto", "text"],
  ["contract_type", "Tipo de contrato", "text"],
  ["start_date", "Fecha de alta", "date"],
  ["weekly_hours", "Jornada (h/sem)", "number"],
  ["gross_salary", "Salario bruto anual (€)", "number"],
  ["dni", "DNI / NIE", "text"],
  ["nss", "Nº Seguridad Social", "text"],
  ["iban", "IBAN", "text"],
  ["phone", "Teléfono", "text"],
  ["emergency_contact", "Contacto de emergencia", "text"],
  ["address", "Dirección", "text"],
];

function FichaEditor({ e, pending, onSave }) {
  const [form, setForm] = useState(() => {
    const f = {};
    for (const [k] of FICHA_FIELDS) f[k] = e[k] ?? "";
    return f;
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="px-3 pb-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-border/50">
        {FICHA_FIELDS.map(([k, label, type]) => (
          <label key={k} className="flex flex-col gap-1">
            <span className="text-micro text-mutedSoft">{label}</span>
            <input
              type={type}
              value={form[k] ?? ""}
              onChange={(ev) => set(k, ev.target.value)}
              className="h-8 rounded-lg bg-surface px-2.5 text-[12.5px] text-ink"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end mt-2.5">
        <button onClick={() => onSave(form)} disabled={pending} className="btn-primary h-8 text-[12.5px] disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar ficha"}
        </button>
      </div>
    </div>
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
