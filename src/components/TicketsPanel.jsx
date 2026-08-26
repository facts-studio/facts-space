"use client";

import { useState } from "react";
import { Surface, SectionHeader, Badge, Tabs } from "@/components/ui";
import { isOpenTicket, isUnassigned, statusKey } from "@/lib/tickets";
import { cn } from "@/lib/cn";

// Color por estado. El punto es lo único teñido: la tarjeta se mantiene neutra
// para que la rejilla no parezca un semáforo.
const TONES = {
  pendiente: { dot: "bg-warn", kind: "pending" },
  bloqueado: { dot: "bg-danger", kind: "danger" },
  "en curso": { dot: "bg-info", kind: "permiso" },
  "en desarrollo": { dot: "bg-info", kind: "permiso" },
  "a la espera de feedback": { dot: "bg-violet", kind: "baja" },
};
const toneOf = (s) => TONES[statusKey(s)] ?? { dot: "bg-mutedSoft", kind: "neutral" };

// "17 h" / "26 d" — la antigüedad de un ticket sin dueño es la señal que importa.
function age(ts, now) {
  if (!ts) return null;
  const h = Math.floor((now - ts) / 3600000);
  const d = Math.floor(h / 24);
  return {
    text: h < 1 ? "recién llegado" : h < 24 ? `hace ${h} h` : `hace ${d} ${d === 1 ? "día" : "días"}`,
    // Un ticket lleva demasiado tiempo esperando: se dice en rojo, no en gris.
    stale: d >= 5,
  };
}

function Ticket({ t, now, meSlackId }) {
  const tone = toneOf(t.status);
  const libre = isUnassigned(t);
  const mio = Boolean(meSlackId) && t.assigneeId === meSlackId;
  const edad = age(t.createdAt, now);
  return (
    <Surface
      as="a"
      href={t.url}
      target="_blank"
      rel="noreferrer"
      variant="muted"
      pad="sm"
      hover
      className="flex flex-col gap-2.5"
    >
      {/* El estado va a la derecha del título, en su misma línea: no gasta una
          fila propia y deja el título como lo primero que se lee. */}
      <div className="flex items-start gap-3">
        <p className="flex-1 min-w-0 text-[15px] leading-snug text-ink font-medium line-clamp-2">{t.title}</p>
        <Badge kind={tone.kind} className="shrink-0">{t.status || "Sin estado"}</Badge>
      </div>

      <div className="mt-auto flex items-center gap-2 text-micro min-w-0">
        {libre ? (
          <Badge kind="ink" className="shrink-0 pulse-attention">Sin dueño</Badge>
        ) : mio ? (
          <span className="text-success font-medium shrink-0">Tuyo</span>
        ) : (
          <span className="text-muted truncate">{t.assignee}</span>
        )}
        {t.author && <span className="text-mutedSoft truncate">de {t.author}</span>}
        {edad && (
          <span className={cn("ml-auto shrink-0 tabular-nums", edad.stale && libre ? "text-danger" : "text-mutedSoft")}>
            {edad.text}
          </span>
        )}
      </div>
    </Surface>
  );
}

// Módulo de Inicio con los tickets abiertos del canal compartido. Los que no
// tienen responsable van primero y con más peso: son los que se quedan parados.
export default function TicketsPanel({ tickets = [], meSlackId = null, className = "" }) {
  // Por defecto, los tuyos. Sin perfil de Slack vinculado, "míos" son los que
  // no ha cogido nadie: siguen siendo cosa tuya mientras estén libres.
  const [scope, setScope] = useState("mios");
  if (!tickets.length) return null;
  const now = new Date().getTime();

  const abiertos = tickets.filter(isOpenTicket);
  const libres = abiertos.filter(isUnassigned);
  const resto = abiertos.filter((t) => !isUnassigned(t));
  const mios = meSlackId ? resto.filter((t) => t.assigneeId === meSlackId) : [];
  // Sin dueño primero (hay que cogerlos), luego los tuyos, luego el resto.
  const todos = [...libres, ...mios, ...resto.filter((t) => !mios.includes(t))];
  // "Míos" incluye los que no tiene nadie: también son cosa tuya mientras nadie
  // los coja. Si no estás vinculado a Slack no hay "míos" que valga.
  const visibles = scope === "mios" ? [...libres, ...mios] : todos;
  // Nada tuyo ni nada por coger → el módulo no pinta nada en Inicio. Lo que
  // tengan otros asignado no es motivo para ocupar sitio en tu pantalla.
  if (libres.length + mios.length === 0) return null;
  // Recuento por estado, en el orden en que aparecen: es el resumen del tablero.
  const porEstado = visibles.reduce((acc, t) => {
    const k = t.status || "Sin estado";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className={className}>
      <SectionHeader
        label={`Tickets · ${visibles.length} abiertos`}
        action={
          <span className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-3">
              {Object.entries(porEstado).map(([estado, n]) => (
                <span key={estado} className="inline-flex items-center gap-1.5 text-micro text-muted">
                  {estado}
                  <Badge kind={toneOf(estado).kind} className="px-0 justify-center min-w-[20px] tabular-nums">
                    {n}
                  </Badge>
                </span>
              ))}
            </span>
            <Tabs
              value={scope}
              onChange={setScope}
              tabs={[
                { value: "mios", label: `Míos ${libres.length + mios.length}` },
                { value: "todos", label: `Todos ${todos.length}` },
              ]}
            />
          </span>
        }
      />

      {/* Mismos radios concéntricos que Sprints: pastillas rounded-2xl (20px)
          con 12px de aire → contenedor rounded-4xl (32px). */}
      <Surface pad="none" className="p-3 !rounded-4xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {visibles.map((t) => <Ticket key={t.id} t={t} now={now} meSlackId={meSlackId} />)}
        </div>
      </Surface>

    </section>
  );
}
