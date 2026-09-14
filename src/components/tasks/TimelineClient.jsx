"use client";

// Timeline global. Aquí vive lo único que el cronograma no puede saber: qué
// proyectos son del estudio y cuáles del trabajo con Unfiltrade. El filtro
// recorta a la vez las barras y los proyectos sin fechas del pie, para que la
// pantalla no diga dos cosas distintas.
import { useMemo, useState } from "react";
import SprintGantt from "@/components/SprintGantt";
import SinFechas from "@/components/tasks/SinFechas";
import { Switch } from "@/components/ui";

export default function TimelineClient({ proyectos = [], sinFecha = [], sprint, back }) {
  const [soloEstudio, setSoloEstudio] = useState(false);
  const filtrar = (lista) => (soloEstudio ? lista.filter((p) => p.esDelEstudio) : lista);
  const filas = useMemo(() => filtrar(proyectos), [proyectos, soloEstudio]); // eslint-disable-line react-hooks/exhaustive-deps
  const pie = useMemo(() => filtrar(sinFecha), [sinFecha, soloEstudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // El rango se recalcula con lo que queda a la vista: si solo miras F*cts, la
  // escala no debería seguir estirada por un sprint de Unfiltrade.
  const rango = useMemo(() => {
    if (!filas.length) return { start: null, due: null };
    return {
      start: Math.min(...filas.map((p) => p.startDate)),
      due: Math.max(...filas.map((p) => p.dueDate)),
    };
  }, [filas]);

  return (
    <SprintGantt
      sprint={{ ...sprint, ...rango }}
      tasks={filas}
      readOnly
      colorPorFila
      back={back}
      controls={
        <Switch
          checked={soloEstudio}
          onChange={setSoloEstudio}
          label="Solo F*cts"
          className="text-[12.5px] text-muted shrink-0"
        />
      }
      footer={<SinFechas items={pie} />}
    />
  );
}
