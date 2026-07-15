"use client";

import { useState } from "react";
import QuickLinks from "@/components/QuickLinks";
import LoMasCercano from "@/components/LoMasCercano";
import TareasHoy from "@/components/TareasHoy";
import TareasEquipoSemana from "@/components/TareasEquipoSemana";
import NotasClient from "@/app/(portal)/notas/notas-client";

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
  overview,
  isAdmin = false,
  initialNotes = [],
  canUseNotes = false,
  className = "",
}) {
  const [mode, setMode] = useState("inicio"); // inicio | status | notas

  return (
    <div className={className}>
      <QuickLinks className="mt-10" mode={mode} onSelect={setMode} />

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
            <LoMasCercano events={events} />
            {mode === "status" ? (
              <TareasEquipoSemana tasks={teamTasks} campaigns={campaigns} statusesByList={statusesByList} className="mt-4" />
            ) : (
              <TareasHoy tasks={tasks} overview={overview} isAdmin={isAdmin} className="mt-4" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
