"use client";

import { useMemo, useState, useTransition } from "react";
import { updateEmployee, validateMonth } from "@/lib/actions/admin";
import { decideVacation, setVacationStatus, deleteVacation } from "@/lib/actions/vacations";
import { deleteDocument, getDocumentUrl } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { fmtRange, fmtDate } from "@/lib/mock";
import { formatDuration, madridTime } from "@/lib/dates";
import { absenceLabel } from "@/lib/absences";

const durMs = (e) => (e.clock_out ? new Date(e.clock_out) - new Date(e.clock_in) : 0);
const TABS = [["resumen", "Resumen"], ["nominas", "Nóminas"], ["ausencias", "Ausencias"], ["horario", "Control horario"], ["documentos", "Documentos"]];

export default function EmpleadoClient({ employee, employees, requests, documents, time, vacUsed, month, year }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [tab, setTab] = useState("resumen");
  const e = employee;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {e.photo ? <img src={e.photo} alt="" className="w-12 h-12 rounded-full object-cover" /> : <span className="w-12 h-12 rounded-full bg-surface2" />}
        <div>
          <h1 className="font-display text-[24px] text-ink leading-tight">{e.name}</h1>
          <p className="text-small text-muted">{e.role || "—"}</p>
        </div>
      </div>

      <div className="flex items-center bg-surface2/60 rounded-lg p-0.5 w-fit">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-3.5 py-1.5 rounded-md text-[13px] transition ${tab === v ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"}`}>{l}</button>
        ))}
      </div>

      {tab === "resumen" && <Resumen e={e} employees={employees} requests={requests} documents={documents} time={time} vacUsed={vacUsed} year={year} onDone={refresh} />}
      {tab === "nominas" && <Docs e={e} documents={documents.filter((d) => d.category === "nomina")} category="nomina" month={month} onDone={refresh} />}
      {tab === "ausencias" && <Ausencias requests={requests} onDone={refresh} />}
      {tab === "horario" && <Horario e={e} time={time} month={month} onDone={refresh} />}
      {tab === "documentos" && <Docs e={e} documents={documents.filter((d) => d.category !== "nomina")} category="documento" month={month} onDone={refresh} />}
    </div>
  );
}

function Resumen({ e, employees, requests, documents, time, vacUsed, year, onDone }) {
  const [edit, setEdit] = useState(false);
  if (edit) return <FichaForm e={e} employees={employees} onCancel={() => setEdit(false)} onSaved={() => { setEdit(false); onDone(); }} />;
  const allowance = Number(e.vacation_allowance) + Number(e.vacation_adjustment || 0);
  const monthMs = time.reduce((s, t) => s + durMs(t), 0);
  const nominas = documents.filter((d) => d.category === "nomina").slice(0, 3);
  const upcoming = requests.filter((r) => r.status === "approved" && r.end_date >= new Date().toISOString().slice(0, 10)).slice(0, 4);

  const fullName = [e.name, e.last_name].filter(Boolean).join(" ");
  const fullAddress = [e.address, e.postal_code, e.city, e.province, e.country].filter(Boolean).join(" · ");
  const personal = [
    ["Nombre completo", fullName], ["Fecha de nacimiento", e.birthday ? fmtDate(e.birthday) : ""],
    ["Nacionalidad", e.nationality], ["Género", e.gender], ["Estado civil", e.marital_status],
    ["DNI / NIE", e.dni], ["Nº Seguridad Social (NAF)", e.nss],
    ["Email empresa", e.email], ["Email personal", e.personal_email],
    ["Teléfono", e.phone], ["Móvil", e.mobile],
    ["Dirección", fullAddress], ["Contacto de emergencia", e.emergency_contact],
  ];
  const banco = [
    ["Banco", e.bank_name], ["IBAN", e.iban], ["SWIFT / BIC", e.swift],
  ];
  const contrato = [
    ["Puesto", e.role], ["Tipo de contrato", e.contract_type],
    ["Inicio del contrato", e.start_date ? fmtDate(e.start_date) : ""],
    ["Jornada", e.weekly_hours ? `${Number(e.weekly_hours)}h semanales` : ""],
    ["Jornada laboral", e.work_schedule], ["Modalidad", e.work_mode],
    ["Salario bruto anual", e.gross_salary ? `${Number(e.gross_salary).toLocaleString("es-ES")} €` : ""],
  ];
  const empresa = [
    ["Razón social", COMPANY.name], ["CIF", COMPANY.cif], ["Centro", COMPANY.center],
  ];

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-3 items-start">
      <div className="space-y-3">
        <FichaCard e={e} employees={employees} onEdit={() => setEdit(true)} />
      </div>

      <div className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label={`Vacaciones ${year}`} value={`${allowance - vacUsed}`} sub={`de ${allowance} · ${vacUsed} usados`} />
          <Stat label="Horas del mes" value={formatDuration(monthMs)} />
          <Stat label="Jornadas" value={String(time.length)} sub="este mes" />
        </div>

        <Info title="Datos personales" rows={personal} />
        <Info title="Contrato" rows={contrato} />
        <Info title="Datos bancarios" rows={banco} />
        <Info title="Empresa" rows={empresa} />

        <div className="rounded-2xl bg-surface/55 p-6">
          <p className="section-eyebrow mb-4">Últimas nóminas</p>
          {nominas.length ? (
            <ul className="divide-y divide-border/50">{nominas.map((d) => <DocLine key={d.id} d={d} />)}</ul>
          ) : <p className="text-small text-mutedSoft">Sin nóminas.</p>}
        </div>

        <div className="rounded-2xl bg-surface/55 p-6">
          <p className="section-eyebrow mb-4">Próximas ausencias</p>
          {upcoming.length ? (
            <ul className="divide-y divide-border/50">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5 text-small">
                  <span className="text-ink">{absenceLabel(r.type)}</span>
                  <span className="text-mutedSoft capitalize">{fmtRange(r.start_date, r.end_date)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-small text-mutedSoft">Sin ausencias próximas.</p>}
        </div>
      </div>
    </div>
  );
}

// Tarjeta lateral de solo lectura (organización). El botón "Editar" abre el
// formulario completo de ficha.
function FichaCard({ e, employees, onEdit }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-eyebrow">Ficha</p>
        <button onClick={onEdit} className="text-micro text-muted hover:text-ink transition">Editar</button>
      </div>
      <dl className="flex flex-col gap-2.5">
        <Row k="Responsable" v={employees.find((m) => m.id === e.manager_id)?.name || "—"} />
        <Row k="Admin" v={e.is_admin ? "Sí" : "No"} />
        <Row k="Activo" v={e.active ? "Sí" : "No"} />
      </dl>
    </div>
  );
}

// Ficha legal completa, agrupada, editable. Campo: [key, label, type, options?].
const GENDER = ["", "Masculino", "Femenino", "Otro"];
const MARITAL = ["", "Soltero/a", "Casado/a", "Pareja de hecho", "Divorciado/a", "Viudo/a"];
const IDDOC = ["", "DNI", "NIE", "Pasaporte"];
const WORK_MODE = ["", "Presencial", "Remoto", "Híbrido"];
// Datos de la empresa (comunes a toda la plantilla).
const COMPANY = { name: "NEW BRANCH STUDIO SL", cif: "B75522276", center: "NEW BRANCH STUDIO SL" };
const FICHA_GROUPS = [
  ["Datos de filiación", [
    ["name", "Nombre", "text"], ["last_name", "Apellidos", "text"], ["birthday", "Fecha de nacimiento", "date"],
    ["nationality", "Nacionalidad", "text"], ["gender", "Género", "select", GENDER], ["marital_status", "Estado civil", "select", MARITAL],
    ["id_doc_type", "Tipo de documento", "select", IDDOC], ["dni", "Nº de documento", "text"], ["nss", "Nº Seguridad Social (NAF)", "text"],
  ]],
  ["Datos de contacto", [
    ["email", "Email de la empresa", "email"], ["personal_email", "Email personal", "email"], ["phone", "Teléfono", "text"], ["mobile", "Móvil", "text"],
    ["address", "Dirección", "text"], ["postal_code", "Código postal", "text"], ["city", "Ciudad", "text"],
    ["province", "Provincia", "text"], ["country", "País", "text"], ["emergency_contact", "Contacto de emergencia", "text"],
    ["photo", "Foto (URL)", "text"],
  ]],
  ["Datos bancarios", [
    ["bank_name", "Banco", "text"], ["iban", "IBAN", "text"], ["swift", "SWIFT/BIC", "text"],
  ]],
  ["Contrato", [
    ["role", "Puesto", "text"], ["contract_type", "Tipo de contrato", "text"], ["start_date", "Fecha de alta", "date"],
    ["weekly_hours", "Jornada (h/sem)", "number"], ["work_schedule", "Jornada laboral", "text"], ["work_mode", "Modalidad", "select", WORK_MODE],
    ["gross_salary", "Salario bruto anual (€)", "number"],
    ["vacation_allowance", "Días vacaciones/año (base)", "number"], ["vacation_adjustment", "Días extra (+/−)", "number"],
  ]],
];

function FichaForm({ e, employees, onCancel, onSaved }) {
  const [pending, run] = useTransition();
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(() => {
    const f = {};
    for (const [, fields] of FICHA_GROUPS) for (const [k] of fields) f[k] = e[k] ?? "";
    f.manager_id = e.manager_id || ""; f.is_admin = e.is_admin; f.active = e.active;
    return f;
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => run(async () => {
    setMsg(null);
    const r = await updateEmployee({ id: e.id, patch: form });
    if (r.ok) onSaved(); else setMsg(r.error);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-eyebrow">Editar ficha de {e.name}</p>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="btn-ghost h-8 text-[12.5px]">Cancelar</button>
          <button onClick={save} disabled={pending} className="btn-primary h-8 text-[12.5px] disabled:opacity-50">{pending ? "Guardando…" : "Guardar ficha"}</button>
        </div>
      </div>
      {msg && <p className="text-micro text-danger">{msg}</p>}

      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Organización</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Fld label="Responsable">
            <select value={form.manager_id} onChange={(ev) => set("manager_id", ev.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink">
              <option value="">— Sin responsable</option>
              {employees.filter((m) => m.id !== e.id).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Fld>
          <div className="flex items-end gap-5">
            <label className="flex items-center gap-2 text-small text-ink"><input type="checkbox" checked={form.is_admin} onChange={(ev) => set("is_admin", ev.target.checked)} /> Admin</label>
            <label className="flex items-center gap-2 text-small text-ink"><input type="checkbox" checked={form.active} onChange={(ev) => set("active", ev.target.checked)} /> Activo</label>
          </div>
        </div>
      </div>

      {FICHA_GROUPS.map(([title, fields]) => (
        <div key={title} className="rounded-2xl bg-surface/55 p-6">
          <p className="section-eyebrow mb-4">{title}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map(([k, label, type, options]) =>
              k === "photo" ? (
                <div key={k} className="sm:col-span-2 lg:col-span-3">
                  <span className="text-micro text-mutedSoft">Foto</span>
                  <div className="mt-1"><AvatarUpload employeeId={e.id} value={form.photo} onChange={(v) => set("photo", v)} /></div>
                </div>
              ) : k === "bank_name" ? (
                <Fld key={k} label={label}>
                  <BankField value={form.bank_name ?? ""} onChange={(v) => set("bank_name", v)} />
                </Fld>
              ) : (
                <Fld key={k} label={label}>
                  {type === "select" ? (
                    <select value={form[k] ?? ""} onChange={(ev) => set(k, ev.target.value)} className="h-9 rounded-lg bg-surface px-2 text-[13px] text-ink">
                      {options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={form[k] ?? ""} onChange={(ev) => set(k, ev.target.value)} className="h-9 rounded-lg bg-surface px-2.5 text-[13px] text-ink" />
                  )}
                </Fld>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Sube la foto al bucket público "avatars" y devuelve su URL.
function AvatarUpload({ employeeId, value, onChange }) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState(null);
  const upload = async (file) => {
    if (!file) return;
    setErr(null);
    setPending(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${employeeId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e2) {
      setErr(e2?.message || "No se pudo subir la imagen.");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {value ? <img src={value} alt="" className="w-12 h-12 rounded-full object-cover" /> : <span className="w-12 h-12 rounded-full bg-surface2" />}
      <label className="btn-ghost h-8 text-[12.5px] cursor-pointer">
        {pending ? "Subiendo…" : value ? "Cambiar foto" : "Subir foto"}
        <input type="file" accept="image/*" className="hidden" disabled={pending} onChange={(ev) => upload(ev.target.files?.[0])} />
      </label>
      {value && <button type="button" onClick={() => onChange("")} className="text-micro text-mutedSoft hover:text-danger transition">Quitar</button>}
      {err && <span className="text-micro text-danger">{err}</span>}
    </div>
  );
}

function Ausencias({ requests, onDone }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-4">Ausencias</p>
      {requests.length === 0 ? <p className="text-small text-mutedSoft">Sin solicitudes.</p> : (
        <ul className="divide-y divide-border/50">
          {requests.map((r) => <AusenciaRow key={r.id} r={r} onDone={onDone} />)}
        </ul>
      )}
    </div>
  );
}

const STATUS_PILL = {
  pending: ["Pendiente", "bg-warnSoft/60 text-warn"],
  approved: ["Aprobada", "bg-successSoft/60 text-success"],
  rejected: ["Rechazada", "bg-dangerSoft/60 text-danger"],
  cancelled: ["Cancelada", "bg-surface2 text-muted"],
};

function AusenciaRow({ r, onDone }) {
  const [pending, run] = useTransition();
  const decide = (approve) => run(async () => { const res = await decideVacation({ id: r.id, approve }); if (res.ok) onDone(); });
  const change = (status) => run(async () => { const res = await setVacationStatus({ id: r.id, status }); if (res.ok) onDone(); });
  const del = () => run(async () => { const res = await deleteVacation(r.id); if (res.ok) onDone(); });
  const [label, cls] = STATUS_PILL[r.status] || [r.status, "bg-surface2 text-muted"];
  return (
    <li className="group flex items-center gap-3 py-2.5">
      <span className="w-[130px] shrink-0 text-small text-ink">{absenceLabel(r.type)}</span>
      <span className="flex-1 text-small text-mutedSoft capitalize">{fmtRange(r.start_date, r.end_date)}</span>
      <span className="w-[70px] text-right text-micro text-mutedSoft tabular-nums">{Number(r.working_days)} lab.</span>
      {r.status === "pending" ? (
        <span className="flex items-center gap-1.5">
          <button onClick={() => decide(false)} disabled={pending} className="btn-ghost h-7 text-[12px]">Rechazar</button>
          <button onClick={() => decide(true)} disabled={pending} className="btn-primary h-7 text-[12px]">Aprobar</button>
        </span>
      ) : (
        <>
          <span className={`rounded-full px-2.5 py-0.5 text-micro font-medium group-hover:hidden ${cls}`}>{label}</span>
          <span className="hidden group-hover:flex items-center gap-1.5">
            <select value={r.status} onChange={(e) => change(e.target.value)} disabled={pending} className="h-7 rounded-lg bg-surface px-2 text-[12px] text-ink">
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <button onClick={del} disabled={pending} aria-label="Eliminar" className="h-7 w-7 grid place-items-center rounded-lg text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition">✕</button>
          </span>
        </>
      )}
    </li>
  );
}

function Horario({ e, time, month, onDone }) {
  const [pending, run] = useTransition();
  const monthLabel = new Date(+month.slice(0, 4), +month.slice(5) - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const byDay = useMemo(() => {
    const m = new Map();
    for (const t of time) { if (!m.has(t.work_date)) m.set(t.work_date, []); m.get(t.work_date).push(t); }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [time]);
  const pendingCount = time.filter((t) => t.status !== "validated").length;
  const validate = () => run(async () => { const r = await validateMonth({ employeeId: e.id, month }); if (r.ok) onDone(); });
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-eyebrow capitalize">Control horario · {monthLabel}</p>
        <div className="flex items-center gap-2">
          <a href={`/api/fichaje/export?month=${month}&employee=${e.id}`} className="text-small text-muted hover:text-ink transition">↓ CSV</a>
          <button onClick={validate} disabled={pending || pendingCount === 0} className="btn-ghost h-8 text-[12.5px] disabled:opacity-40">{pendingCount === 0 ? "Validado" : `Validar (${pendingCount})`}</button>
        </div>
      </div>
      {byDay.length === 0 ? <p className="text-small text-mutedSoft">Sin fichajes este mes.</p> : (
        <ul className="divide-y divide-border/50">
          {byDay.map(([d, list]) => (
            <li key={d} className="flex items-center gap-3 py-2.5">
              <span className="w-[170px] shrink-0 text-small text-ink capitalize">{fmtDate(d)}</span>
              <span className="flex-1 text-micro text-mutedSoft">{list.map((t, i) => `${i ? " · " : ""}${madridTime(t.clock_in)}–${t.clock_out ? madridTime(t.clock_out) : "—"}`).join("")}</span>
              <span className="text-small tabular-nums text-ink">{formatDuration(list.reduce((s, t) => s + durMs(t), 0))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Docs({ documents, category, onDone }) {
  const isNomina = category === "nomina";
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-eyebrow">{isNomina ? "Nóminas" : "Documentos"}</p>
        <span className="text-micro text-mutedSoft">Se suben desde Admin › Documentos</span>
      </div>
      {documents.length === 0 ? <p className="text-small text-mutedSoft">Nada todavía.</p> : (
        <ul className="divide-y divide-border/50">{documents.map((d) => <DocLine key={d.id} d={d} onDone={onDone} admin />)}</ul>
      )}
    </div>
  );
}

function DocLine({ d, onDone, admin }) {
  const [pending, run] = useTransition();
  const open = () => run(async () => { const r = await getDocumentUrl(d.id); if (r.ok) window.open(r.url, "_blank"); });
  const del = () => run(async () => { const r = await deleteDocument(d.id); if (r.ok) onDone?.(); });
  const label = d.title || (d.category === "nomina" ? `Nómina ${d.period}` : d.category === "contrato" ? "Contrato" : "Documento");
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <button onClick={open} disabled={pending} className="text-small text-ink hover:underline truncate text-left">{label}</button>
        <p className="text-micro text-mutedSoft">{fmtDate(d.created_at.slice(0, 10))}</p>
      </div>
      {admin && <button onClick={del} disabled={pending} className="h-7 w-7 grid place-items-center rounded-lg text-mutedSoft hover:text-danger hover:bg-dangerSoft/50 transition shrink-0">✕</button>}
    </li>
  );
}

function Info({ title, rows }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-4">{title}</p>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">{rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</dl>
    </div>
  );
}
function Row({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-small text-mutedSoft shrink-0">{k}</dt>
      <dd className="text-small text-ink text-right break-words">{v || "—"}</dd>
    </div>
  );
}
function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-5">
      <p className="section-eyebrow mb-2">{label}</p>
      <p className="font-display text-[24px] leading-none text-ink tabular-nums">{value}</p>
      {sub ? <p className="text-micro text-mutedSoft mt-1.5">{sub}</p> : null}
    </div>
  );
}
// Bancos más usados en España + opción personalizada.
const BANKS = [
  "CaixaBank", "BBVA", "Banco Santander", "Banco Sabadell", "Bankinter", "ING",
  "Unicaja Banco", "Kutxabank", "Abanca", "Ibercaja", "Cajamar", "Openbank",
  "EVO Banco", "Deutsche Bank España", "Laboral Kutxa", "Caixa d'Enginyers",
  "Revolut", "N26", "Wise",
];
function BankField({ value, onChange }) {
  const known = value === "" || BANKS.includes(value);
  const [other, setOther] = useState(!known);
  const cls = "h-9 rounded-lg bg-surface px-2 text-[13px] text-ink";
  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={other ? "__custom" : value}
        onChange={(e) => {
          if (e.target.value === "__custom") { setOther(true); onChange(""); }
          else { setOther(false); onChange(e.target.value); }
        }}
        className={cls}
      >
        <option value="">—</option>
        {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
        <option value="__custom">Otro (personalizar)…</option>
      </select>
      {other && (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nombre del banco" className={`${cls} px-2.5`} />
      )}
    </div>
  );
}

function Fld({ label, children }) {
  return <label className="flex flex-col gap-1"><span className="text-micro text-mutedSoft">{label}</span>{children}</label>;
}
