"use client";

import { useMemo, useState } from "react";
import QuickLinks from "@/components/QuickLinks";
import LoMasCercano from "@/components/LoMasCercano";
import TareasHoy from "@/components/TareasHoy";
import TareasEquipoSemana from "@/components/TareasEquipoSemana";
import SprintsActivos from "@/components/SprintsActivos";
import TicketsPanel from "@/components/TicketsPanel";
import NotasClient from "@/app/(portal)/notas/notas-client";
import { TEAM } from "@/lib/mock";

const PHOTO = new Map(TEAM.map((m) => [m.name, m.photo]));
const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseISO = (iso) => new Date(iso + "T00:00:00");

// Quién está de vacaciones o cumple HOY → píldoras de presencia junto a Status.
function presenceNow(events) {
  const now = new Date();
  const hoy = startOfDay(now);
  const out = [];
  const hasta = (endISO) => parseISO(endISO).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  for (const e of events) {
    if (e.type === "vacaciones" && e.who && parseISO(e.start) <= now && parseISO(e.end) >= hoy) {
      out.push({ key: `vac-${e.id}`, name: e.who, photo: PHOTO.get(e.who) || null, icon: "🏖️", hint: `${e.who} · hasta el ${hasta(e.end)}` });
    }
    if (e.type === "cumple" && e.who && e.start === `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`) {
      out.push({ key: `cum-${e.id}`, name: e.who, photo: PHOTO.get(e.who) || null, icon: "🎂", hint: `¡Feliz cumple, ${e.who}!` });
    }
  }
  return out;
}

// Bloque inferior de Inicio. Los accesos directos quedan fijos y conmutan el modo:
//   inicio → Lo más cercano + Tus tareas de la semana
//   status → Lo más cercano + Tareas del equipo de la semana (por cliente)
//   notas  → el bloc personal (sustituye todo el bloque)
export default function HomePanels({
  events = [],
  tasks = [],
  teamTasks = [],
  campaigns = [],
  statusesByList = {},
  sprintMeta = {},
  sprints = [],
  tickets = [],
  meSlackId = null,
  isAdmin = false,
  initialNotes = [],
  canUseNotes = false,
  className = "",
}) {
  const [mode, setMode] = useState("inicio"); // inicio | status | notas
  const presence = useMemo(() => presenceNow(events), [events]);

  return (
    <div className={className}>
      <QuickLinks className="mt-10" mode={mode} onSelect={setMode} presence={presence} />

      <div className="mt-8">
        {mode === "notas" ? (
          canUseNotes ? (
            <NotasClient initialNotes={initialNotes} />
          ) : (
            <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted">
              Tu cuenta no está dada de alta como empleado, así que aún no puedes usar Notas.
            </div>
          )
        ) : (
          <>
            {/* "Lo más cercano" es la agenda personal: en Status estorba, que
                va del estado del equipo. */}
            {mode !== "status" && <LoMasCercano events={events} />}
            <SprintsActivos sprints={sprints} className={mode === "status" ? "" : "mt-8"} />
            {/* Los tickets de los canales compartidos van tras los sprints: son
                trabajo entrante, antes de bajar a las tareas del día. */}
            <TicketsPanel tickets={tickets} meSlackId={meSlackId} className="mt-8" />
            {mode === "status" ? (
              <TareasEquipoSemana tasks={teamTasks} campaigns={campaigns} statusesByList={statusesByList} sprintMeta={sprintMeta} className="mt-8" />
            ) : (
              <TareasHoy tasks={tasks} isAdmin={isAdmin} className="mt-8" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
