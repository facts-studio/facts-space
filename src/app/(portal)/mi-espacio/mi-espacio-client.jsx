"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtRange, fmtDate } from "@/lib/mock";

const TABS = [
  ["resumen", "Resumen"],
  ["datos", "Datos"],
  ["nominas", "Nóminas"],
  ["documentos", "Documentos"],
];

export default function MiEspacioClient({ me, overview, missingCount }) {
  const [tab, setTab] = useState("resumen");
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
          </button>
        ))}
      </div>

      {tab === "resumen" && <Resumen me={me} overview={overview} missingCount={missingCount} />}
      {tab === "datos" && <Datos me={me} />}
      {tab === "nominas" && <Soon title="Nóminas" text="Aquí verás y descargarás tus nóminas cuando administración las publique." />}
      {tab === "documentos" && <Soon title="Documentos" text="Aquí estarán tu contrato y documentos." />}
    </div>
  );
}

function Resumen({ me, overview, missingCount }) {
  const o = overview;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Vacaciones restantes" value={o ? `${o.remaining}` : "—"} sub={o ? `de ${o.allowance} días · ${o.used} usados` : ""} />
        <Stat label="Días sin fichar" value={String(missingCount)} sub="este mes" />
        <Stat label="Jornada" value={`${Number(me.weekly_hours)}h`} sub="semanales" />
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

function Datos({ me }) {
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

function Soon({ title, text }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-6">
      <p className="section-eyebrow mb-2">{title}</p>
      <p className="text-small text-mutedSoft">{text}</p>
    </div>
  );
}
