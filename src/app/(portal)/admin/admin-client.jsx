"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { decideVacation, setVacationStatus, deleteVacation } from "@/lib/actions/vacations";
import { updateEmployee, validateMonth, createEmployee, setEmployeeClickupGroup, setEmployeeSlackUser, autolinkSlackUsers } from "@/lib/actions/admin";
import { recordDocument, deleteDocument, getDocumentUrl } from "@/lib/actions/documents";
import { extractInvoice } from "@/lib/actions/extract";
import { createClient } from "@/lib/supabase/client";
import { fmtRange, fmtDate } from "@/lib/mock";
import { formatDuration } from "@/lib/dates";
import { absenceLabel } from "@/lib/absences";
import { isExternal, TEAM_DOMAIN } from "@/lib/team";
import { evaluateVacation } from "@/lib/vacation-policy";
import { Avatar, Badge, Button, Field, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import ClickUpSources from "@/components/admin/ClickUpSources";

const TABS = [
  ["aprobaciones", "Aprobaciones"],
  ["equipo", "Empleados"],
  ["documentos", "Documentos"],
  ["clickup", "ClickUp"],
  ["informes", "Informes"],
];

export default function AdminClient({ meId, employees, pending, recent, timeStats, vacUsed, timeHours = {}, documents = [], clickupLists = [], clickupGroups = [], slackUsers = [], events = [], month, year }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const refresh = () => router.refresh();
  // La pestaña vive en la URL (?tab=…) para poder enlazar y compartir una
  // vista concreta, y para que atrás/adelante del navegador funcionen.
  const q = params.get("tab");
  const tab = TABS.some(([v]) => v === q) ? q : TABS[0][0];
  const setTab = (v) => {
    const next = new URLSearchParams(params);
    if (v === TABS[0][0]) next.delete("tab"); else next.set("tab", v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
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
      {tab === "equipo" && <Equipo employees={employees} vacUsed={vacUsed} year={year} clickupGroups={clickupGroups} slackUsers={slackUsers} onDone={refresh} />}
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
const EMP_FILTERS = [["activos", "Activos"], ["inactivos", "Inactivos"], ["todos", "Todos"]];

function Equipo({ employees, vacUsed, year, clickupGroups = [], slackUsers = [], onDone }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("activos");
  const activos = employees.filter((e) => e.active).length;
  const inactivos = employees.length - activos;
  const list = employees.filter((e) =>
    filter === "todos" ? true : filter === "activos" ? e.active : !e.active
  );

  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="section-eyebrow">Empleados · {activos} activos{inactivos ? ` · ${inactivos} inactivos` : ""}</p>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>+ Añadir persona</Button>
        )}
      </div>
      {adding && <AddEmployee employees={employees} clickupGroups={clickupGroups} slackUsers={slackUsers} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); onDone?.(); }} />}

      <div className="flex items-center bg-surface2/60 rounded-lg p-0.5 w-fit mb-3">
        {EMP_FILTERS.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1 rounded-md text-[12.5px] transition ${filter === v ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"}`}>{l}</button>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-border/50">
        <div className="flex items-center gap-3 px-3 pb-2 text-micro uppercase tracking-wide text-mutedSoft">
          <span className="flex-1">Persona</span>
          <span className="w-[150px] hidden lg:block">ClickUp</span>
          <span className="w-[150px] hidden xl:block">Slack</span>
          <span className="w-[44px] text-center hidden md:block" title="Plantilla del estudio o colaborador externo">Vínculo</span>
          <span className="w-[76px] text-right" title={`Días de vacaciones disponibles en ${year}`}>Vacaciones</span>
        </div>
        {list.length === 0 ? (
          <p className="text-small text-mutedSoft px-3 py-4">No hay empleados {filter === "activos" ? "activos" : filter === "inactivos" ? "inactivos" : ""}.</p>
        ) : list.map((e) => (
          <EmployeeRow key={e.id} e={e} used={vacUsed[e.id] || 0} clickupGroups={clickupGroups} slackUsers={slackUsers} onDone={onDone} />
        ))}
      </div>
    </div>
  );
}

// Alta de una persona. Pide lo que hace falta para que arranque de verdad: sus
// datos, el vínculo con el estudio (decide si tendrá fichaje y ficha laboral) y
// los enlaces con ClickUp y Slack, que si se dejan para luego se olvidan y
// entonces no salen sus cumpleaños ni se le atribuyen tareas ni tickets. El
// resto de la ficha (contrato, banco, jornada) se completa después.
function AddEmployee({ onDone, onCancel, employees = [], clickupGroups = [], slackUsers = [] }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: "", lastName: "", email: "", role: "", birthday: "",
    managerId: "", clickupGroupId: "", slackUserId: "", vacationAllowance: 22,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  // Se propone por el dominio del email (igual que team.js) pero se puede
  // cambiar antes de crear: hay externos con cuenta propia.
  const [externo, setExterno] = useState(false);
  const [externoTocado, setExternoTocado] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();

  const onEmail = (v) => {
    set("email", v);
    if (!externoTocado && v.includes("@")) setExterno(!v.trim().toLowerCase().endsWith(`@${TEAM_DOMAIN}`));
  };
  const listo = f.name.trim().length > 1 && /.+@.+\..+/.test(f.email.trim());
  const submit = () => {
    if (!listo) return;
    setMsg(null);
    run(async () => {
      const res = await createEmployee({ ...f, isExternal: externo });
      if (res.ok) { onDone?.(); router.push(`/admin/${res.id}`); } else setMsg(res.error);
    });
  };
  // Enter crea desde cualquier campo; los selects se dejan en paz.
  const onKeyDown = (ev) => { if (ev.key === "Enter") { ev.preventDefault(); submit(); } };

  return (
    <div className="rounded-2xl bg-surface2/40 p-5 mb-4">
      <p className="section-eyebrow mb-4">Nueva persona</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nombre">
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} onKeyDown={onKeyDown} placeholder="Nombre" autoFocus />
        </Field>
        <Field label="Apellidos" hint="Opcional">
          <Input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} onKeyDown={onKeyDown} placeholder="Apellidos" />
        </Field>
        <Field label="Email" className="sm:col-span-2 lg:col-span-1">
          <Input type="email" value={f.email} onChange={(e) => onEmail(e.target.value)} onKeyDown={onKeyDown} placeholder="nombre@dominio.com" />
        </Field>
        <Field label="Puesto" hint="Opcional">
          <Input value={f.role} onChange={(e) => set("role", e.target.value)} onKeyDown={onKeyDown} placeholder="Product Designer" />
        </Field>

        {/* Dos opciones con nombre propio se leen mejor que un interruptor
            etiquetado "Externo", que obliga a deducir qué significa apagado. */}
        <Field label="Vínculo">
          <div className="flex items-center h-9 bg-surface rounded-lg border border-border p-0.5 w-fit">
            {[[false, "Plantilla"], [true, "Externo"]].map(([v, l]) => (
              <button
                key={l}
                type="button"
                onClick={() => { setExterno(v); setExternoTocado(true); }}
                className={cn(
                  "px-3 h-full rounded-[7px] text-[12.5px] transition whitespace-nowrap",
                  externo === v ? "bg-ink text-bg font-medium" : "text-muted hover:text-ink"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Cumpleaños" hint="Sale en el calendario del equipo">
          <Input type="date" value={f.birthday} onChange={(e) => set("birthday", e.target.value)} />
        </Field>
        <Field label="Responsable" hint="Quién aprueba sus ausencias">
          <Select
            value={f.managerId}
            onChange={(v) => set("managerId", v)}
            placeholder="Sin responsable"
            options={employees.filter((m) => m.active).map((m) => ({ value: m.id, label: m.name }))}
          />
        </Field>
        <Field label="Vacaciones al año" hint="Días base, ajustable luego">
          <Input type="number" min="0" max="60" value={f.vacationAllowance} onChange={(e) => set("vacationAllowance", e.target.value)} onKeyDown={onKeyDown} />
        </Field>

        <Field label="Perfil de ClickUp" hint="Para ver sus tareas y su cumpleaños">
          <Select
            value={f.clickupGroupId}
            onChange={(v) => set("clickupGroupId", v)}
            placeholder="Sin vincular"
            options={clickupGroups.map((g) => ({ value: g.id, label: g.name }))}
          />
        </Field>
        <Field label="Perfil de Slack" hint="Para atribuirle sus tickets">
          <Select
            value={f.slackUserId}
            onChange={(v) => set("slackUserId", v)}
            placeholder="Sin vincular"
            options={slackUsers.map((u) => ({ value: u.id, label: u.name + (u.guest ? " (invitado)" : "") }))}
          />
        </Field>
      </div>

      <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
        <p className="text-micro text-mutedSoft leading-snug max-w-[58ch]">
          Se vincula al entrar con Google con ese mismo email.{" "}
          {externo
            ? "Como externo no ficha, ni tiene nómina, contrato o datos bancarios."
            : "Como plantilla tendrá fichaje y ficha laboral completa."}
        </p>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {msg && <p className="text-micro text-danger mr-1">{msg}</p>}
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" onClick={submit} disabled={pending || !listo} title={listo ? undefined : "Faltan el nombre y un email válido"}>
            {pending ? "Creando…" : "Crear persona"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Selector de vínculo (ClickUp / Slack) sin caja: el valor se lee como texto y
// solo al pasar el ratón se ve que es editable. Con 8 filas, ocho cajas grises
// pesaban más que la propia información.
function LinkSelect({ value, onChange, disabled, options, placeholder, title, fallbackLabel }) {
  const vinculado = Boolean(value);
  const huerfano = vinculado && !options.some((o) => o.id === value);
  return (
    <span className="relative block group/sel">
      <select
        value={value || ""}
        onChange={(ev) => onChange(ev.target.value)}
        disabled={disabled}
        title={title}
        className={cn(
          "peer h-7 w-full appearance-none rounded-lg bg-transparent pl-2 pr-6 text-[12.5px] truncate cursor-pointer transition",
          "hover:bg-surface2/70 focus:bg-surface focus:outline-none",
          vinculado ? "text-ink" : "text-mutedSoft/70"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        {/* Vinculado a algo que ya no aparece en el directorio → no perder la selección */}
        {huerfano && <option value={value}>{fallbackLabel}</option>}
      </select>
      <svg
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-mutedSoft opacity-0 group-hover/sel:opacity-100 peer-focus:opacity-100 transition-opacity"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

// Vínculo con el estudio, en un solo icono: carné encendido = plantilla,
// apagado = colabora desde fuera. BadgeSolid/Badge de MynaUI (mynaui.com/icons).
function VinculoToggle({ externo, onClick, disabled }) {
  const label = externo ? "Externo · colabora desde fuera" : "Plantilla de F*cts Studio";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${label} — pulsa para cambiar`}
      aria-label={label}
      aria-pressed={!externo}
      className={cn(
        "h-7 w-7 grid place-items-center rounded-lg transition disabled:opacity-40",
        externo ? "text-mutedSoft/60 hover:text-ink hover:bg-surface2/70" : "text-ink hover:bg-surface2/70"
      )}
    >
      {externo ? (
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9.713 3.64c.581-.495.872-.743 1.176-.888a2.58 2.58 0 0 1 2.222 0c.304.145.595.393 1.176.888.599.51 1.207.768 2.007.831.761.061 1.142.092 1.46.204.734.26 1.312.837 1.571 1.572.112.317.143.698.204 1.46.063.8.32 1.407.83 2.006.496.581.744.872.889 1.176.336.703.336 1.52 0 2.222-.145.304-.393.595-.888 1.176a3.3 3.3 0 0 0-.831 2.007c-.061.761-.092 1.142-.204 1.46a2.58 2.58 0 0 1-1.572 1.571c-.317.112-.698.143-1.46.204-.8.063-1.407.32-2.006.83-.581.496-.872.744-1.176.889a2.58 2.58 0 0 1-2.222 0c-.304-.145-.595-.393-1.176-.888a3.3 3.3 0 0 0-2.007-.831c-.761-.061-1.142-.092-1.46-.204a2.58 2.58 0 0 1-1.571-1.572c-.112-.317-.143-.698-.204-1.46a3.3 3.3 0 0 0-.83-2.006c-.496-.581-.744-.872-.89-1.176a2.58 2.58 0 0 1 .001-2.222c.145-.304.393-.595.888-1.176.52-.611.769-1.223.831-2.007.061-.761.092-1.142.204-1.46a2.58 2.58 0 0 1 1.572-1.571c.317-.112.698-.143 1.46-.204a3.3 3.3 0 0 0 2.006-.83" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden>
          <path d="M13.435 2.075a3.33 3.33 0 0 0-2.87 0c-.394.189-.755.497-1.26.928l-.079.066a2.56 2.56 0 0 1-1.58.655l-.102.008c-.662.053-1.135.09-1.547.236a3.33 3.33 0 0 0-2.03 2.029c-.145.412-.182.885-.235 1.547l-.008.102a2.56 2.56 0 0 1-.655 1.58l-.066.078c-.431.506-.74.867-.928 1.261a3.33 3.33 0 0 0 0 2.87c.189.394.497.755.928 1.26l.066.079c.41.48.604.939.655 1.58l.008.102c.053.662.09 1.135.236 1.547a3.33 3.33 0 0 0 2.029 2.03c.412.145.885.182 1.547.235l.102.008c.629.05 1.09.238 1.58.655l.078.066c.506.431.867.74 1.261.928a3.33 3.33 0 0 0 2.87 0c.394-.189.755-.497 1.26-.928l.079-.066c.48-.41.939-.604 1.58-.655l.102-.008c.662-.053 1.135-.09 1.547-.236a3.33 3.33 0 0 0 2.03-2.029c.145-.412.182-.885.235-1.547l.008-.102c.05-.629.238-1.09.655-1.58l.066-.079c.431-.505.74-.866.928-1.26a3.33 3.33 0 0 0 0-2.87c-.189-.394-.497-.755-.928-1.26l-.066-.079a2.56 2.56 0 0 1-.655-1.58l-.008-.102c-.053-.662-.09-1.135-.236-1.547a3.33 3.33 0 0 0-2.029-2.03c-.412-.145-.885-.182-1.547-.235l-.102-.008a2.56 2.56 0 0 1-1.58-.655l-.079-.066c-.505-.431-.866-.74-1.26-.928" />
        </svg>
      )}
    </button>
  );
}

function EmployeeRow({ e, used, clickupGroups = [], slackUsers = [], onDone }) {
  const [pending, run] = useTransition();
  const allowance = Number(e.vacation_allowance) + Number(e.vacation_adjustment || 0);
  const remaining = allowance - used;
  const externo = isExternal(e);

  const linkGroup = (groupId) => run(async () => {
    const r = await setEmployeeClickupGroup({ id: e.id, groupId });
    if (r.ok) onDone?.(); else alert(r.error);
  });
  const linkSlack = (userId) => run(async () => {
    const r = await setEmployeeSlackUser({ id: e.id, userId });
    if (r.ok) onDone?.(); else alert(r.error);
  });
  const toggleExterno = () => run(async () => {
    const r = await updateEmployee({ id: e.id, patch: { is_external: !externo } });
    if (r.ok) onDone?.(); else alert(r.error);
  });

  return (
    <div className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface2/40 transition ${e.active ? "" : "opacity-60"}`}>
      <Link href={`/admin/${e.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
        <Avatar name={e.name} lastName={e.last_name} color={e.color} photo={e.photo} size={32} />
        <div className="min-w-0">
          <p className="text-small text-ink truncate flex items-center gap-1.5">
            <span className="truncate">{e.name}{e.last_name ? ` ${e.last_name}` : ""}</span>
            {/* Admin e inactivo van junto al nombre: son dos casos raros y no
                merecen una columna propia en las ocho filas. */}
            {e.is_admin && <span className="shrink-0 text-[10px] uppercase tracking-wide text-mutedSoft">Admin</span>}
            {!e.active && <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted bg-surface2 rounded px-1.5 py-0.5">Inactivo</span>}
          </p>
          <p className="text-micro text-mutedSoft truncate">{e.role || "—"}</p>
        </div>
      </Link>
      <span className="w-[150px] hidden lg:block">
        <LinkSelect
          value={e.clickup_group_id}
          onChange={linkGroup}
          disabled={pending}
          options={clickupGroups.map((g) => ({ id: g.id, label: g.name }))}
          placeholder="Sin vincular"
          fallbackLabel="Vinculado"
          title={e.clickup_group_id ? "Perfil de ClickUp vinculado" : "Sin vincular — no aparece en cumpleaños ni calendario"}
        />
      </span>
      <span className="w-[150px] hidden xl:block">
        <LinkSelect
          value={e.slack_user_id}
          onChange={linkSlack}
          disabled={pending}
          options={slackUsers.map((u) => ({ id: u.id, label: u.name + (u.guest ? " (invitado)" : "") }))}
          placeholder="Sin vincular"
          fallbackLabel="Vinculado"
          title={e.slack_user_id ? "Perfil de Slack vinculado" : "Sin vincular — sus tickets no se marcan como suyos"}
        />
      </span>
      <span className="w-[44px] hidden md:flex justify-center">
        <VinculoToggle externo={externo} onClick={toggleExterno} disabled={pending} />
      </span>
      <span className="w-[76px] text-right text-small tabular-nums text-ink">
        {remaining}<span className="text-mutedSoft">/{allowance}</span>
      </span>

    </div>
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
        <Avatar name={e.name} lastName={e.last_name} color={e.color} photo={e.photo} size={28} />
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

