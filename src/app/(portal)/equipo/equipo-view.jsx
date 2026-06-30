"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EventPill } from "@/components/EventBadge";
import { EVENT_TYPES, fmtRange, fmtDate } from "@/lib/mock";

function memberEvents(events, name) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return events
    .filter((e) => e.who === name)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e) => ({ ...e, done: new Date(e.end + "T00:00:00") < today }));
}

export default function EquipoView({ team, events, vacUsed = {}, year }) {
  const [openId, setOpenId] = useState(null);
  const m = team.find((x) => x.id === openId) || null;

  return (
    <div>
      <PageHeader
        eyebrow="Personas"
        title="Equipo"
        helper="Quién es quién en F*cts Studio."
      />

      <div className={m ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start" : ""}>
        {/* Cuadrícula de personas — foto protagonista */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {team.map((p) => {
            const active = p.id === openId;
            return (
              <button
                key={p.id}
                onClick={() => setOpenId(active ? null : p.id)}
                className={`group rounded-2xl overflow-hidden bg-surface/55 hover:bg-surface transition text-left ${active ? "ring-1 ring-borderStrong" : ""}`}
              >
                <div className="aspect-square overflow-hidden bg-surface2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300" />
                </div>
                <div className="p-3.5">
                  <p className="text-body font-medium text-ink truncate">{p.name}</p>
                  <p className="text-micro text-muted truncate">{p.role}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Columna derecha — ficha de la persona */}
        {m && (
          <aside key={m.id} className="slide-in mt-6 lg:mt-0 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:border-border lg:pl-7">
            <div className="flex justify-end mb-2">
              <button onClick={() => setOpenId(null)} aria-label="Cerrar" className="h-7 w-7 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <h2 className="font-display text-[26px] text-ink leading-tight">{m.name}</h2>
            <p className="text-body text-muted">{m.role}</p>

            <dl className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-small text-mutedSoft">Email</dt>
                <dd className="text-small text-ink truncate">{m.email}</dd>
              </div>
              {m.birthday && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-small text-mutedSoft">Cumpleaños</dt>
                  <dd className="text-small text-ink">🎂 {fmtDate(m.birthday)}</dd>
                </div>
              )}
              {m.vacation_allowance != null && (() => {
                const allowance = Number(m.vacation_allowance) + Number(m.vacation_adjustment || 0);
                return (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-small text-mutedSoft">Vacaciones {year}</dt>
                    <dd className="text-small text-ink tabular-nums">
                      {allowance - (vacUsed[m.id] || 0)} restantes
                      <span className="text-mutedSoft"> · {vacUsed[m.id] || 0} de {allowance}</span>
                    </dd>
                  </div>
                );
              })()}
            </dl>

            {memberEvents(events, m.name).length > 0 && (
              <div className="mt-6">
                <h3 className="section-eyebrow mb-3">Eventos del año</h3>
                <ul className="flex flex-col gap-2">
                  {memberEvents(events, m.name).map((e) => (
                    <li key={e.id} className={`flex items-center justify-between gap-3 ${e.done ? "opacity-45" : ""}`}>
                      <span className="text-small text-ink flex items-center gap-2">
                        {e.done && <span className="text-mutedSoft">✓</span>}
                        {fmtRange(e.start, e.end)}
                      </span>
                      <EventPill color={EVENT_TYPES[e.type].color}>{EVENT_TYPES[e.type].label}</EventPill>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
