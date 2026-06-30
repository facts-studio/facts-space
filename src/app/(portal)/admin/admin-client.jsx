"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideVacation } from "@/lib/actions/vacations";
import { updateEmployee, validateMonth } from "@/lib/actions/admin";
import { fmtRange } from "@/lib/mock";

const TABS = [
  ["solicitudes", "Solicitudes"],
  ["equipo", "Equipo"],
  ["fichaje", "Fichaje"],
];

export default function AdminClient({ employees, pending, recent, timeStats, vacUsed, month, year }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [tab, setTab] = useState("solicitudes");
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
            {v === "solicitudes" && pending.length > 0 && (
              <span className="ml-1.5 text-micro text-warn">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "solicitudes" && <Solicitudes pending={pending} recent={recent} nameById={nameById} onDone={refresh} />}
      {tab === "equipo" && <Equipo employees={employees} vacUsed={vacUsed} year={year} onDone={refresh} />}
      {tab === "fichaje" && <Fichaje employees={employees} timeStats={timeStats} month={month} onDone={refresh} />}
    </div>
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
        <p className="text-small text-ink">{who}</p>
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
