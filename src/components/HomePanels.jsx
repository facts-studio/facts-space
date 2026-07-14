"use client";

import { useState } from "react";
import QuickLinks from "@/components/QuickLinks";
import LoMasCercano from "@/components/LoMasCercano";
import TareasHoy from "@/components/TareasHoy";
import NotasClient from "@/app/(portal)/notas/notas-client";

// Bloque inferior de Inicio. Los accesos directos quedan fijos; debajo se
// alterna entre el modo "inicio" (Lo más cercano + Tus tareas) y "notas".
export default function HomePanels({
  events = [],
  tasks = [],
  overview,
  isAdmin = false,
  initialNotes = [],
  canUseNotes = false,
  className = "",
}) {
  const [mode, setMode] = useState("inicio"); // inicio | notas

  return (
    <div className={className}>
      <QuickLinks
        className="mt-10"
        notasActive={mode === "notas"}
        onToggleNotas={() => setMode((m) => (m === "notas" ? "inicio" : "notas"))}
      />

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
            <TareasHoy tasks={tasks} overview={overview} isAdmin={isAdmin} className="mt-4" />
          </>
        )}
      </div>
    </div>
  );
}
