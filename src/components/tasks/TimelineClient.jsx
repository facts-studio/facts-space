"use client";

// Timeline global. Aquí vive lo único que el cronograma no puede saber: qué
// proyectos son del estudio y cuáles del trabajo con Unfiltrade. El filtro
// recorta a la vez las barras y los proyectos sin fechas del pie, para que la
// pantalla no diga dos cosas distintas.
import { useMemo, useState } from "react";
import SprintGantt from "@/components/SprintGantt";
import SinFechas from "@/components/tasks/SinFechas";
import { Switch } from "@/components/ui";
import CompartirTimeline from "@/components/tasks/CompartirTimeline";

// El timeline NO se pinta por cliente: con doce proyectos a la vez, seis
// colores de marca convierten la pantalla en un semáforo y el color deja de
// significar nada. Aquí el color dice UNA cosa —en qué punto está el
// proyecto— y se hace con tokens de interfaz, que son neutros por diseño.
//
// El trabajo con Unfiltrade va aparte, todo del mismo color: no es un proyecto
// del estudio con sus fases, es otra cosa, y así se distingue de un golpe.
//
// El space "F*cts Studio" de ClickUp son los clientes de Adhōc; por eso el
// filtro se llama así y no por el nombre del space.
const v = (token, alfa = 1) => `rgb(var(--ct-${token}) / ${alfa})`;

// El fondo baja de intensidad según la fase; el TEXTO no, porque un proyecto
// apagado se sigue teniendo que leer. En oscuro `ink` es casi blanco y
// `surface2` un gris levantado, así que el par funciona en los dos temas.
const COLOR_FASE = {
  activo: { bg: v("ink", 0.13), fg: v("ink"), border: v("ink", 0.2), tagBg: v("ink", 0.1) },
  aprobado: { bg: v("ink", 0.09), fg: v("ink"), border: v("ink", 0.14), tagBg: v("ink", 0.08) },
  propuesta: { bg: v("surface2", 0.8), fg: v("inkSoft"), border: v("ink", 0.08), tagBg: v("ink", 0.07) },
  parado: {
    bg: v("surface2", 0.45),
    fg: v("muted"),
    border: v("ink", 0.08),
    // Las rayas solo tienen que insinuar "parado": por encima de esto
    // compiten con el texto que llevan encima.
    stripe: v("mutedSoft", 0.17),
    tagBg: v("ink", 0.06),
  },
};
const COLOR_UNFILTRADE = { bg: v("infoSoft"), fg: v("info"), border: v("info", 0.22), tagBg: v("info", 0.12) };

// Dos situaciones mandan sobre el área y sobre la fase, porque son las que
// piden mirar: está todo hecho, o la fecha quedó atrás con trabajo vivo dentro.
const COLOR_COMPLETADO = { bg: v("successSoft"), fg: v("success"), border: v("success", 0.24), tagBg: v("success", 0.12) };
const COLOR_RETRASO = { bg: v("warnSoft"), fg: v("warn"), border: v("warn", 0.3), tagBg: v("warn", 0.14) };

function colorDe(p) {
  if (p.completado) return COLOR_COMPLETADO;
  if (p.fueraDePlazo) return COLOR_RETRASO;
  if (!p.esDelEstudio) return COLOR_UNFILTRADE;
  return COLOR_FASE[p.phase?.key] ?? COLOR_FASE.propuesta;
}

// `isAdmin` gobierna los dos controles de la cabecera, y por el mismo motivo:
// solo un admin ve el mapa entero. Al resto ya le llega recortado —lo de
// Unfiltrade más los proyectos a los que se le invita—, así que un filtro por
// área le ofrecería separar algo que no tiene mezclado.
export default function TimelineClient({ proyectos = [], sinFecha = [], sprint, back, publico = false, isAdmin = false, now = null }) {
  const [soloEstudio, setSoloEstudio] = useState(false);
  const filtrar = (lista) =>
    (soloEstudio ? lista.filter((p) => p.esDelEstudio) : lista).map((p) => ({ ...p, color: colorDe(p) }));
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
      back={back}
      now={now}
      titleExtra={isAdmin && !publico ? <CompartirTimeline /> : null}
      controls={
        // En la vista pública ya son todos de Adhōc: no hay nada que filtrar.
        publico || !isAdmin ? null : (
          <span className="flex items-center gap-1 shrink-0">
            <Switch
              checked={soloEstudio}
              onChange={setSoloEstudio}
              label="Adhōc"
              className="text-[12.5px] text-muted shrink-0"
            />
          </span>
        )
      }
      footer={<SinFechas items={pie} />}
    />
  );
}
