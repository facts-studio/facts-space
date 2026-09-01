"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fmtRange, fmtDate } from "@/lib/mock";
import { ABSENCE_TYPES } from "@/lib/absences";
import { getDocumentUrl } from "@/lib/actions/documents";
import { isExternal, companyOf } from "@/lib/team";

// `team`: pestañas que solo tienen sentido con relación laboral con el estudio.
const TABS = [
  ["resumen", "Resumen"],
  ["ausencias", "Ausencias"],
  ["datos", "Datos"],
  ["nominas", "Nóminas", true],
  ["documentos", "Documentos"],
];

const STATUS = {
  pending: ["Pendiente", "bg-warnSoft/60 text-warn"],
  approved: ["Aprobada", "bg-successSoft/60 text-success"],
  rejected: ["Rechazada", "bg-dangerSoft/60 text-danger"],
  cancelled: ["Cancelada", "bg-surface2 text-muted"],
};

export default function MiEspacioClient({ me, overview, missingCount, requests = [], documents = [] }) {
  const externo = isExternal(me);
  const nominas = documents.filter((d) => d.category === "nomina");
  const otros = documents.filter((d) => d.category !== "nomina");
  const [tab, setTab] = useState("resumen");
  const tabs = TABS.filter(([, , soloEquipo]) => !soloEquipo || !externo);
  return (
    <div className="space-y-3">
      <div className="flex items-center bg-surface2/60 rounded-lg p-0.5 w-fit">
        {tabs.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] transition ${tab === v ? "bg-bg text-ink shadow-sm font-medium" : "text-muted hover:text-ink"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "resumen" && <Resumen me={me} overview={overview} missingCount={missingCount} externo={externo} />}
      {tab === "ausencias" && <Ausencias requests={requests} />}
      {tab === "datos" && <Datos me={me} externo={externo} />}
      {tab === "nominas" && !externo && <DocList title="Nóminas" items={nominas} empty="Aún no hay nóminas publicadas." />}
      {tab === "documentos" && <DocList title="Documentos" items={otros} empty="Aún no hay documentos." />}
    </div>
  );
}

function Resumen({ me, overview, missingCount, externo = false }) {
  const o = overview;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Vacaciones restantes" value={o ? `${o.remaining}` : "—"} sub={o ? `de ${o.allowance} días · ${o.used} usados` : ""} />
        {/* Días sin fichar y jornada son de la plantilla; un externo ve de qué
            empresa viene, que es lo que le sitúa en el portal. */}
        {externo ? (
          <Stat label="Empresa" value={companyOf(me) || "—"} sub="colaboración externa" />
        ) : (
          <>
            <Stat label="Días sin fichar" value={String(missingCount)} sub="este mes" />
            <Stat label="Jornada" value={`${Number(me.weekly_hours)}h`} sub="semanales" />
          </>
        )}
      </div>

      <div className="rounded-2xl bg-surface/55 p-6">
        <p className="section-eyebrow mb-4">Próximas vacaciones</p>
        {o?.upcoming?.length ? (
          <ul className="divide-y divide-border/50">
            {o.upcoming.map((v, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-small">
                <span className="text-ink capitalize">{fmtRange(v.start_date, v.end_date)}</span>
                <span className="text-mutedSoft tabular-nums">{Number(v.working_days)} laborables</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-mutedSoft">No tienes vacaciones próximas. Pídelas desde el calendario.</p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <QuickLink href="/calendario" title="Pedir vacaciones" desc="Elige las fechas en el calendario." />
        <QuickLink href="/fichaje" title="Fichar" desc="Registra tu jornada de hoy." />
        <QuickLink href="/calendario" title="Calendario" desc="Vacaciones y festivos del equipo." />
      </div>
    </div>
  );
}

function Ausencias({ requests }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-eyebrow">Mis ausencias</p>
        <Link href="/calendario" className="text-small text-muted hover:text-ink transition">+ Solicitar en el calendario</Link>
      </div>
      {requests.length === 0 ? (
        <p className="text-small text-mutedSoft">No tienes solicitudes. Pídelas desde el calendario.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {requests.map((r) => {
            const [sLabel, sCls] = STATUS[r.status] || [r.status, "bg-surface2 text-muted"];
            return (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <span className="w-[130px] shrink-0 text-small text-ink">{ABSENCE_TYPES[r.type]?.label || r.type}</span>
                <span className="flex-1 text-small text-mutedSoft capitalize">{fmtRange(r.start_date, r.end_date)}</span>
                <span className="w-[90px] text-right text-micro text-mutedSoft tabular-nums">{Number(r.working_days)} lab.</span>
                <span className={`rounded-full px-2.5 py-0.5 text-micro font-medium ${sCls}`}>{sLabel}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Datos({ me, externo = false }) {
  // De un colaborador externo no guardamos nómina, contrato ni banco: solo lo
  // necesario para trabajar juntos.
  if (externo) {
    return (
      <div className="grid lg:grid-cols-2 gap-3">
        <FieldCard
          title="Contacto"
          rows={[["Nombre", [me.name, me.last_name].filter(Boolean).join(" ")], ["Email", me.email], ["Teléfono", me.phone]]}
        />
        <FieldCard title="Colaboración" rows={[["Empresa", companyOf(me)], ["Rol", me.role]]} />
        <p className="lg:col-span-2 text-micro text-mutedSoft">
          Colaboras con F*cts Studio desde fuera, así que aquí no guardamos datos laborales tuyos: ni contrato, ni nómina, ni datos bancarios.
        </p>
      </div>
    );
  }
  const personales = [
    ["DNI / NIE", me.dni],
    ["Teléfono", me.phone],
    ["Dirección", me.address],
    ["Contacto de emergencia", me.emergency_contact],
    ["Nº Seguridad Social", me.nss],
    ["IBAN", me.iban],
  ];
  const laborales = [
    ["Puesto", me.role],
    ["Tipo de contrato", me.contract_type],
    ["Jornada semanal", me.weekly_hours ? `${Number(me.weekly_hours)} h` : ""],
    ["Fecha de alta", me.start_date ? fmtDate(me.start_date) : ""],
    ["Salario bruto anual", me.gross_salary ? `${Number(me.gross_salary).toLocaleString("es-ES")} €` : ""],
    ["Email", me.email],
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <FieldCard title="Datos personales" rows={personales} />
      <FieldCard title="Datos laborales" rows={laborales} />
      <p className="lg:col-span-2 text-micro text-mutedSoft">
        Para corregir cualquier dato, contacta con administración. Esta información es confidencial y solo la ves tú y administración.
      </p>
    </div>
  );
}

function FieldCard({ title, rows }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-4">{title}</p>
      <dl className="flex flex-col gap-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4">
            <dt className="text-small text-mutedSoft shrink-0">{k}</dt>
            <dd className="text-small text-ink text-right break-words">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DocList({ title, items, empty }) {
  const [pending, run] = useTransition();
  const open = (id) => run(async () => { const r = await getDocumentUrl(id); if (r.ok) window.open(r.url, "_blank"); });
  const labelOf = (d) => d.title || (d.category === "nomina" ? `Nómina ${d.period}` : d.category === "contrato" ? "Contrato" : "Documento");
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-4">{title}</p>
      {items.length === 0 ? (
        <p className="text-small text-mutedSoft">{empty}</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-small text-ink truncate">{labelOf(d)}</p>
                <p className="text-micro text-mutedSoft">{fmtDate(d.created_at.slice(0, 10))}</p>
              </div>
              <button onClick={() => open(d.id)} disabled={pending} className="btn-ghost h-8 text-[12.5px]">Descargar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-5">
      <p className="section-eyebrow mb-2">{label}</p>
      <p className="font-display text-[26px] leading-none text-ink tabular-nums">{value}</p>
      {sub ? <p className="text-micro text-mutedSoft mt-1.5">{sub}</p> : null}
    </div>
  );
}

function QuickLink({ href, title, desc }) {
  return (
    <Link href={href} className="rounded-2xl bg-surface2/40 hover:bg-surface2/70 transition p-5 block">
      <p className="text-body font-medium text-ink">{title}</p>
      <p className="text-micro text-mutedSoft mt-1">{desc}</p>
    </Link>
  );
}

