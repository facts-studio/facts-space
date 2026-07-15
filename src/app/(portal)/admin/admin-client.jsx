"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decideVacation, setVacationStatus, deleteVacation } from "@/lib/actions/vacations";
import { updateEmployee, validateMonth, createEmployee } from "@/lib/actions/admin";
import { recordDocument, deleteDocument, getDocumentUrl } from "@/lib/actions/documents";
import { extractInvoice } from "@/lib/actions/extract";
import { createClient } from "@/lib/supabase/client";
import { fmtRange, fmtDate } from "@/lib/mock";
import { formatDuration } from "@/lib/dates";
import { absenceLabel } from "@/lib/absences";
import { evaluateVacation } from "@/lib/vacation-policy";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import ClickUpSources from "@/components/admin/ClickUpSources";

const TABS = [
  ["aprobaciones", "Aprobaciones"],
  ["equipo", "Empleados"],
  ["documentos", "Documentos"],
  ["clickup", "ClickUp"],
  ["informes", "Informes"],
];

export default function AdminClient({ employees, pending, recent, timeStats, vacUsed, timeHours = {}, documents = [], clickupLists = [], events = [], month, year }) {
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
          <Solicitudes pending={pending} recent={recent} nameById={nameById} events={events} onDone={refresh} />
          <Fichaje employees={employees} timeStats={timeStats} month={month} onDone={refresh} />
        </div>
      )}
      {tab === "equipo" && <Equipo employees={employees} vacUsed={vacUsed} year={year} onDone={refresh} />}
      {tab === "documentos" && <Documentos employees={employees} documents={documents} nameById={nameById} month={month} onDone={refresh} />}
      {tab === "clickup" && <ClickUpSources lists={clickupLists} />}
      {tab === "informes" && <Informes employees={employees} vacUsed={vacUsed} timeHours={timeHours} month={month} year={year} />}
    </div>
  );
}

// ── Documentos (hub: empresa + empleados) ────────────────────────────────────
const DOC_CATS = { nomina: "Nómina", contrato: "Contrato", factura: "Factura", legal: "Legal", documento: "Documento" };

function Documentos({ employees, documents, nameById, month, onDone }) {
  const [scope, setScope] = useState("empleado"); // empleado | empresa
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [category, setCategory] = useState("nomina");
  const [period, setPeriod] = useState(month);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [filter, setFilter] = useState("all");
  const [pending, run] = useTransition();

  const submit = () => {
    setMsg(null);
    if (!file) { setMsg({ ok: false, text: "Elige un archivo." }); return; }
    if (scope === "empleado" && !employeeId) { setMsg({ ok: false, text: "Elige empleado." }); return; }
    run(async () => {
      const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const base = scope === "empleado" ? employeeId : "empresa";
      const path = `${base}/${category}/${Date.now()}-${safe}`;
      const supabase = createClient();
      const up = await supabase.storage.from("hr-docs").upload(path, file, { upsert: false });
      if (up.error) { setMsg({ ok: false, text: up.error.message }); return; }
      const res = await recordDocument({
        employeeId: scope === "empleado" ? employeeId : null,
        category, title, period: category === "nomina" ? period : "", storagePath: path,
      });
      if (!res.ok) { setMsg({ ok: false, text: res.error }); return; }
      if (category === "factura" && res.id) {
        setMsg({ ok: true, text: "Factura subida. Extrayendo datos…" });
        const ex = await extractInvoice(res.id);
        setMsg(ex.ok ? { ok: true, text: "Factura subida y datos extraídos." } : { ok: true, text: `Factura subida. La extracción falló: ${ex.error}` });
      } else {
        setMsg({ ok: true, text: "Documento subido." });
      }
      setFile(null); setTitle(""); onDone();
    });
  };

  const list = documents.filter((d) => filter === "all" || d.category === filter);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Subir documento</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Ámbito">
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink">
              <option value="empleado">Empleado</option>
              <option value="empresa">Empresa</option>
            </select>
          </Field>
          {scope === "empleado" && (
            <Field label="Empleado">
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink min-w-[150px]">
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Categoría">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink">
              {Object.entries(DOC_CATS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          {category === "nomina" ? (
            <Field label="Mes"><input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink" /></Field>
          ) : (
            <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink" /></Field>
          )}
          <Field label="Archivo"><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[12px] text-muted" /></Field>
          <button onClick={submit} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">{pending ? "Subiendo…" : "Subir"}</button>
        </div>
        {msg && <p className={`text-micro mt-2 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
        <p className="text-micro text-mutedSoft mt-2">Los documentos de empleado (nómina, contrato…) aparecen automáticamente en su ficha y en su “Mi espacio”.</p>
      </div>

      <div className="rounded-2xl bg-surface/55 p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className="section-eyebrow">Todos los documentos ({list.length})</p>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 rounded-lg bg-surface px-2 text-[12.5px] text-ink">
            <option value="all">Todas las categorías</option>
            {Object.entries(DOC_CATS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {list.length === 0 ? (
          <p className="text-small text-mutedSoft">Sin documentos.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {list.map((d) => <HubDocRow key={d.id} d={d} who={d.employee_id ? nameById.get(d.employee_id) : "Empresa"} onDone={onDone} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function HubDocRow({ d, who, onDone }) {
  const [pending, run] = useTransition();
  const [open2, setOpen2] = useState(false);
  const open = () => run(async () => { const r = await getDocumentUrl(d.id); if (r.ok) window.open(r.url, "_blank"); });
  const del = () => run(async () => { const r = await deleteDocument(d.id); if (r.ok) onDone(); });
  const extract = () => run(async () => { const r = await extractInvoice(d.id); if (r.ok) onDone(); });
  const label = d.title || (d.category === "nomina" ? `Nómina ${d.period}` : DOC_CATS[d.category] || "Documento");
  const ex = d.extracted;
  const isFactura = d.category === "factura";
  return (
    <li className={`rounded-xl ${open2 ? "bg-surface2/40" : ""}`}>
      <div className="flex items-center gap-3 py-2.5 px-1">
        <span className="w-[90px] shrink-0"><span className="rounded-full bg-surface2 px-2 py-0.5 text-micro text-muted">{DOC_CATS[d.category] || d.category}</span></span>
        <span className="flex-1 min-w-0 text-small text-ink truncate">
          {isFactura && ex?.supplier ? `${ex.supplier}` : label}
          <span className="text-mutedSoft font-normal"> · {who}</span>
          {isFactura && ex?.total ? <span className="text-mutedSoft font-normal"> · {Number(ex.total).toLocaleString("es-ES")} {ex.currency || "€"}</span> : null}
        </span>
        <span className="text-micro text-mutedSoft hidden sm:inline">{fmtDate(d.created_at.slice(0, 10))}</span>
        {isFactura && <button onClick={() => setOpen2((o) => !o)} className="text-micro text-muted hover:text-ink transition">{ex ? "Datos" : ""}</button>}
        {isFactura && <button onClick={extract} disabled={pending} className="btn-ghost h-8 text-[12px]">{pending ? "…" : ex ? "Re-extraer" : "Extraer"}</button>}
        <button onClick={open} disabled={pending} className="btn-ghost h-8 text-[12.5px]">Ver</button>
        <button onClick={del} disabled={pending} aria-label="Eliminar" className="h-8 w-8 grid place-items-center rounded-lg text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
      </div>
      {isFactura && open2 && ex && (
        <div className="px-3 pb-3 grid sm:grid-cols-3 gap-x-6 gap-y-1.5">
          {[
            ["Proveedor", ex.supplier], ["NIF", ex.supplier_tax_id], ["Nº factura", ex.invoice_number],
            ["Fecha", ex.issue_date], ["Vencimiento", ex.due_date], ["Concepto", ex.concept],
            ["Base", ex.subtotal != null ? `${Number(ex.subtotal).toLocaleString("es-ES")} ${ex.currency || ""}` : ""],
            ["IVA", ex.tax != null ? `${Number(ex.tax).toLocaleString("es-ES")} ${ex.currency || ""}` : ""],
            ["Total", ex.total != null ? `${Number(ex.total).toLocaleString("es-ES")} ${ex.currency || ""}` : ""],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-3 text-micro">
              <span className="text-mutedSoft">{k}</span>
              <span className="text-ink text-right break-words">{v || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

// ── Informes ─────────────────────────────────────────────────────────────────
function Informes({ employees, vacUsed, timeHours, month, year }) {
  const monthLabel = new Date(+month.slice(0, 4), +month.slice(5) - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const rows = employees.filter((e) => e.active).map((e) => {
    const used = vacUsed[e.id] || 0;
    const allowance = Number(e.vacation_allowance) + Number(e.vacation_adjustment || 0);
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
      <div className="flex flex-col divide-y divide-border/50">
        <div className="flex items-center gap-3 px-1 pb-2 text-micro uppercase tracking-wide text-mutedSoft">
          <span className="flex-1">Persona</span>
          <span className="w-[120px] text-right">Vac. restantes</span>
          <span className="w-[110px] text-right">Vac. usadas</span>
          <span className="w-[110px] text-right">Horas mes</span>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-1 py-2.5 hover:bg-surface2/40 transition">
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
function Solicitudes({ pending, recent, nameById, events = [], onDone }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Pendientes de aprobar</p>
        {pending.length === 0 ? (
          <p className="text-small text-mutedSoft">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((r) => (
              <PendingRow key={r.id} r={r} who={nameById.get(r.employee_id)} events={events} onDone={onDone} />
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
              <RecentRow key={r.id} r={r} who={nameById.get(r.employee_id)} onDone={onDone} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Veredicto de política → píldora semántica + tono de cada motivo.
const VERDICT_KIND = { ok: "success", warn: "pending", bad: "danger" };
const REASON_TONE = { ok: "text-mutedSoft", warn: "text-warn", bad: "text-danger" };

function PendingRow({ r, who, events = [], onDone }) {
  const [pending, run] = useTransition();
  const decide = (approve) => run(async () => { const res = await decideVacation({ id: r.id, approve }); if (res.ok) onDone(); });
  // La política es solo de vacaciones. La antelación se mide desde que se pidió
  // (created_at), no desde hoy, para no penalizar la tardanza en resolver.
  const verdict = r.type === "vacaciones"
    ? evaluateVacation(r.start_date, r.end_date, events, r.created_at ? new Date(r.created_at) : new Date())
    : null;

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl bg-surface2/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-small text-ink">{who} <span className="text-mutedSoft font-normal">· {absenceLabel(r.type)}</span></p>
        <p className="text-micro text-mutedSoft">
          {fmtRange(r.start_date, r.end_date)} · {Number(r.working_days)} laborables{r.note ? ` · ${r.note}` : ""}
        </p>

        {/* Parámetros de aceptación: carga del trimestre, antelación y cobertura */}
        {verdict && (
          <div className="mt-2">
            <Badge kind={VERDICT_KIND[verdict.status]}>{verdict.title}</Badge>
            <ul className="mt-1.5 space-y-0.5">
              {verdict.reasons.map((x, i) => (
                <li key={i} className={cn("text-micro flex gap-1.5", REASON_TONE[x.tone])}>
                  <span aria-hidden>·</span>
                  <span>{x.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => decide(false)} disabled={pending} className="btn-ghost h-8 text-[12.5px]">Rechazar</button>
        <button onClick={() => decide(true)} disabled={pending} className="btn-primary h-8 text-[12.5px]">Aprobar</button>
      </div>
    </li>
  );
}

// Fila de solicitud resuelta: muestra el tag de estado; al pasar por encima
// aparecen los controles para cambiar estado o eliminar.
function RecentRow({ r, who, onDone }) {
  const [pending, run] = useTransition();
  const change = (status) => run(async () => { const res = await setVacationStatus({ id: r.id, status }); if (res.ok) onDone(); });
  const del = () => run(async () => { const res = await deleteVacation(r.id); if (res.ok) onDone(); });
  return (
    <li className="group flex items-center gap-3 py-2.5">
      <span className="flex-1 min-w-0 text-small text-ink truncate">{who} <span className="text-mutedSoft font-normal">· {absenceLabel(r.type)}</span></span>
      <span className="text-micro text-muted tabular-nums capitalize hidden sm:inline">{fmtRange(r.start_date, r.end_date)}</span>
      <StatusPill status={r.status} className="group-hover:hidden" />
      <span className="hidden group-hover:flex items-center gap-1.5">
        <select value={r.status} onChange={(e) => change(e.target.value)} disabled={pending} className="h-7 rounded-lg bg-surface px-2 text-[12px] text-ink">
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <button onClick={del} disabled={pending} aria-label="Eliminar" className="h-7 w-7 grid place-items-center rounded-lg text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
      </span>
    </li>
  );
}

function StatusPill({ status, className = "" }) {
  const map = {
    pending: ["Pendiente", "bg-warnSoft/60 text-warn"],
    approved: ["Aprobada", "bg-successSoft/60 text-success"],
    rejected: ["Rechazada", "bg-dangerSoft/60 text-danger"],
    cancelled: ["Cancelada", "bg-surface2 text-muted"],
  };
  const [label, cls] = map[status] || [status, "bg-surface2 text-muted"];
  return <span className={`rounded-full px-2.5 py-0.5 text-micro font-medium ${cls} ${className}`}>{label}</span>;
}

// ── Empleados ────────────────────────────────────────────────────────────────
function Equipo({ employees, vacUsed, year, onDone }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="section-eyebrow">Empleados · {employees.length}</p>
        <button onClick={() => setAdding((o) => !o)} className="btn-primary h-8 text-[12.5px]">{adding ? "Cancelar" : "+ Añadir empleado"}</button>
      </div>
      {adding && <AddEmployee onDone={() => { setAdding(false); onDone?.(); }} />}
      <div className="flex flex-col divide-y divide-border/50">
        <div className="flex items-center gap-3 px-3 pb-2 text-micro uppercase tracking-wide text-mutedSoft">
          <span className="flex-1">Persona</span>
          <span className="w-[200px] hidden md:block">Email</span>
          <span className="w-[80px] text-right">Vac. {year}</span>
          <span className="w-[46px]" />
          <span className="w-[10px]" />
        </div>
        {employees.map((e) => (
          <EmployeeRow key={e.id} e={e} used={vacUsed[e.id] || 0} />
        ))}
      </div>
    </div>
  );
}

function AddEmployee({ onDone }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();
  const submit = () => {
    setMsg(null);
    run(async () => {
      const res = await createEmployee({ name, email, role });
      if (res.ok) { onDone?.(); router.push(`/admin/${res.id}`); } else setMsg(res.error);
    });
  };
  return (
    <div className="rounded-xl bg-surface2/40 p-4 mb-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink min-w-[180px]" /></Field>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@fcts.studio" className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink min-w-[200px]" /></Field>
        <Field label="Puesto"><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Opcional" className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink min-w-[150px]" /></Field>
        <button onClick={submit} disabled={pending} className="btn-primary h-9 text-[13px] disabled:opacity-50">{pending ? "Creando…" : "Crear"}</button>
      </div>
      <p className="text-micro text-mutedSoft mt-2">Se vincula al entrar con su email @fcts.studio. Después completa su ficha.</p>
      {msg && <p className="text-micro text-danger mt-1.5">{msg}</p>}
    </div>
  );
}

function EmployeeRow({ e, used }) {
  const allowance = Number(e.vacation_allowance) + Number(e.vacation_adjustment || 0);
  const remaining = allowance - used;
  return (
    <Link
      href={`/admin/${e.id}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface2/40 transition ${e.active ? "" : "opacity-50"}`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {e.photo ? <img src={e.photo} alt="" className="w-8 h-8 rounded-full object-cover" /> : <span className="w-8 h-8 rounded-full bg-surface2" />}
        <div className="min-w-0">
          <p className="text-small text-ink truncate">{e.name}{e.last_name ? ` ${e.last_name}` : ""}</p>
          <p className="text-micro text-mutedSoft truncate">{e.role || "—"}</p>
        </div>
      </div>
      <span className="w-[200px] hidden md:block text-micro text-mutedSoft truncate">{e.email}</span>
      <span className="w-[80px] text-right text-small tabular-nums text-ink">{remaining} <span className="text-mutedSoft">/ {allowance}</span></span>
      <span className="w-[46px] text-center">{e.is_admin && <span className="text-[10px] uppercase tracking-wide text-mutedSoft bg-surface2 rounded px-1.5 py-0.5">Admin</span>}</span>
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
      <div className="flex flex-col divide-y divide-border/50">
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

