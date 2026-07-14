"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EventPill } from "@/components/EventBadge";
import { EVENT_TYPES, fmtRange, fmtDate } from "@/lib/mock";
import { cn } from "@/lib/cn";

function memberEvents(events, name) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return events
    .filter((e) => e.who === name)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e) => ({ ...e, done: new Date(e.end + "T00:00:00") < today }));
}

const initial = (name) => (name || "?").trim()[0]?.toUpperCase();

// Avatar circular con anillo; fallback a inicial si no hay foto.
function Avatar({ src, name, className }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("rounded-full object-cover ring-1 ring-border/60", className)} />
  ) : (
    <span className={cn("rounded-full grid place-items-center bg-surface2 text-mutedSoft font-display ring-1 ring-border/60", className)}>{initial(name)}</span>
  );
}

export default function EquipoView({ team, events, vacUsed = {}, year }) {
  const [openId, setOpenId] = useState(null);
  const m = team.find((x) => x.id === openId) || null;

  return (
    <div>
      <PageHeader
        eyebrow="Personas"
        title="Equipo"
        helper={`${team.length} personas en F*cts Studio.`}
      />

      <div className={m ? "lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:items-start" : ""}>
        {/* Retícula de personas — imagen arriba, info debajo */}
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", m ? "xl:grid-cols-3" : "lg:grid-cols-4")}>
          {team.map((p) => {
            const active = p.id === openId;
            return (
              <button
                key={p.id}
                onClick={() => setOpenId(active ? null : p.id)}
                className={cn(
                  "group rounded-2xl overflow-hidden bg-surface/55 text-left transition hover:bg-surface hover:shadow-soft",
                  active && "bg-surface ring-1 ring-borderStrong"
                )}
              >
                <div className="aspect-[4/5] overflow-hidden bg-surface2">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500" />
                  ) : (
                    <span className="w-full h-full grid place-items-center font-display text-[40px] text-mutedSoft">{initial(p.name)}</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display text-[16px] leading-tight text-ink truncate">{p.name}{p.last_name ? ` ${p.last_name}` : ""}</p>
                  <p className="text-micro text-muted truncate mt-0.5">{p.role}</p>
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                    <p className="text-micro text-mutedSoft truncate flex items-center gap-1.5">
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                      {p.email}
                    </p>
                    {p.birthday && (
                      <p className="text-micro text-mutedSoft flex items-center gap-1.5">🎂 {fmtDate(p.birthday)}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Columna derecha — ficha de la persona */}
        {m && (
          <aside key={m.id} className="slide-in mt-6 lg:mt-0 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto rounded-2xl bg-surface/55 p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar src={m.photo} name={m.name} className="w-16 h-16 shrink-0 text-[22px]" />
                <div className="min-w-0">
                  <h2 className="font-display text-[22px] text-ink leading-tight truncate">{m.name}{m.last_name ? ` ${m.last_name}` : ""}</h2>
                  <p className="text-small text-muted truncate">{m.role}</p>
                </div>
              </div>
              <button onClick={() => setOpenId(null)} aria-label="Cerrar" className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            {m.vacation_allowance != null && (() => {
              const allowance = Number(m.vacation_allowance) + Number(m.vacation_adjustment || 0);
              const used = vacUsed[m.id] || 0;
              return (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-surface2/50 px-4 py-3">
                    <p className="text-caption uppercase text-mutedSoft">Vac. restantes {year}</p>
                    <p className="font-display text-[22px] text-ink tabular-nums mt-0.5">{allowance - used}<span className="text-mutedSoft text-[14px]"> / {allowance}</span></p>
                  </div>
                  <div className="rounded-xl bg-surface2/50 px-4 py-3">
                    <p className="text-caption uppercase text-mutedSoft">Días usados</p>
                    <p className="font-display text-[22px] text-ink tabular-nums mt-0.5">{used}</p>
                  </div>
                </div>
              );
            })()}

            <dl className="divide-y divide-border/50">
              <Row k="Email" v={m.email} />
              {m.birthday && <Row k="Cumpleaños" v={`🎂 ${fmtDate(m.birthday)}`} />}
            </dl>

            {memberEvents(events, m.name).length > 0 && (
              <div className="mt-6">
                <h3 className="section-eyebrow mb-3">Eventos del año</h3>
                <ul className="flex flex-col gap-2">
                  {memberEvents(events, m.name).map((e) => (
                    <li key={e.id} className={cn("flex items-center justify-between gap-3", e.done && "opacity-45")}>
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

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-small text-mutedSoft">{k}</dt>
      <dd className="text-small text-ink text-right truncate">{v}</dd>
    </div>
  );
}
