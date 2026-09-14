"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tabs, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { paletteColor } from "@/lib/client-palette";
import { teamPhoto } from "@/components/tasks/task-atoms";
import { FctsAsterisk } from "@/components/FctsMark";
import PersonFilter from "@/components/tasks/PersonFilter";
import { setClickUpTaskStatus } from "@/lib/actions/clickup";

const DAY = 86400000;
const startOfDay = (ts) => new Date(ts).setHours(0, 0, 0, 0);
const addDays = (ts, n) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.setHours(0, 0, 0, 0); };
const isWeekend = (ts) => [0, 6].includes(new Date(ts).getDay());
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const dm = (ts) => `${new Date(ts).getDate()} ${MESES[new Date(ts).getMonth()]}`;
// Un rango que cambia de año necesita decirlo: "19 jun – 29 ene" se lee como si
// fuera hacia atrás.
const rangoTexto = (a, b) => {
  const ma = new Date(a).getFullYear();
  const mb = new Date(b).getFullYear();
  const yy = (ts) => ` ${String(new Date(ts).getFullYear()).slice(2)}`;
  return ma === mb ? `${dm(a)} – ${dm(b)}` : `${dm(a)}${yy(a)} – ${dm(b)}${yy(b)}`;
};

// Ancho de un día en píxeles por nivel de zoom. Es lo único que cambia entre
// vistas: el resto del dibujo se deriva de aquí.
const ZOOM = {
  dia: { px: 52, label: "Días" },
  semana: { px: 18, label: "Semanas" },
  mes: { px: 6, label: "Meses" },
};

// La barra es un botón (abre el selector de estado) o un enlace (timeline de
// proyectos, donde lleva a su tablero). Mismo aspecto en ambos casos.
function Bar({ as: Tag = "button", ...rest }) {
  return <Tag {...(Tag === "button" ? { type: "button" } : {})} {...rest} />;
}

// Miniatura de una persona dentro de la barra. En el timeline se solapan unas
// con otras y llevan anillo del fondo; en un sprint va suelta sobre el color.
function Cara({ a, readOnly = false }) {
  const foto = teamPhoto(a.email);
  return (
    <span title={a.name} className={cn("shrink-0", readOnly ? "-ml-1.5 first:ml-0" : "ml-auto pl-1.5")}>
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className={cn("h-5 w-5 rounded-full object-cover", readOnly ? "ring-2 ring-bg" : "ring-1 ring-white/50")} />
      ) : (
        <span className={cn("grid place-items-center h-5 w-5 rounded-full text-[9.5px] font-medium", readOnly ? "bg-bg/70 text-ink ring-2 ring-bg" : "bg-white/25 text-white")}>
          {a.initials ?? a.name?.[0]}
        </span>
      )}
    </span>
  );
}

// Punto de fase en el timeline (el texto completo va en el tooltip).
const FASE_PUNTO = {
  activo: "bg-success",
  aprobado: "bg-info",
  propuesta: "bg-warn",
  parado: "bg-mutedSoft",
};

const norm = (v) => (v || "").toLowerCase().trim();
const TODOS = "__todos__"; // "sin filtro" con un valor propio, no ""
const cerrada = (t) => ["done", "closed"].includes(t.statusType);

// Barra sólida en el color del proyecto. El estado se distingue por el acabado,
// no por el relleno, para que todas se lean igual de fuertes:
//  · pendiente → sólido
//  · en curso  → sólido con rayas claras, como las barras de progreso del portal
//  · hecha     → sólido atenuado, pasa a segundo plano
function barStyle(t, col, suave = false) {
  // Modo suave: relleno en el tono claro del cliente y texto en el fuerte, como
  // las píldoras de cliente del resto del portal. Es lo que pide el timeline
  // global, donde conviven seis clientes y el relleno fuerte los vuelve un
  // semáforo —el terracota compite con el rojo de "vencido" y el crema, cuyo
  // tono fuerte es el negro de marca, sale como una barra negra.
  if (suave) {
    // Filete del tono fuerte: sin él, un relleno claro como el crema de Demà
    // (#E9E7E1) queda a seis puntos de gris del fondo del portal y la barra
    // desaparece. Con el borde, cualquier color se recorta.
    //
    // El acabado dice en qué punto está el proyecto sin leer nada:
    //   en curso / aprobado → sólido, es trabajo comprometido.
    //   propuesta           → atenuado, aún no es nuestro.
    //   parado              → atenuado y rayado (lead, bloqueado, entregado):
    //                         ocupa sitio en el calendario pero no se trabaja.
    const rayado = (t.phase?.key ?? null) === "parado";
    // `stripe` y `border` permiten dar el color con tokens del sistema
    // (rgb(var(--ct-…))), donde el truco del hex con alfa no sirve.
    //
    // Lo apagado se consigue con el ALFA del fondo, nunca con `opacity` sobre
    // la barra: eso arrastraba también al texto y en oscuro lo dejaba ilegible.
    return {
      style: {
        background: col.bg,
        ...(rayado
          ? { backgroundImage: `repeating-linear-gradient(45deg, ${col.stripe ?? `${col.fg}2b`} 0 5px, transparent 5px 11px)` }
          : null),
        borderColor: col.border ?? `${col.fg}33`,
      },
      text: col.fg,
    };
  }
  if (cerrada(t)) {
    return { style: { background: col.fg, borderColor: "transparent", opacity: 0.4 }, text: "#fff" };
  }
  if (t.statusType === "custom") {
    return {
      style: {
        backgroundColor: col.fg,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 4px, transparent 4px 10px)",
        borderColor: "transparent",
      },
      text: "#fff",
    };
  }
  return { style: { background: col.fg, borderColor: "transparent" }, text: "#fff" };
}

// Rango a dibujar: el del sprint (ampliado si alguna tarea se sale) más margen
// generoso a los lados y cuadrado a meses completos. La línea de tiempo no debe
// morir en la última tarea: se sigue pudiendo mirar meses por delante y por
// detrás, que es de lo que va un cronograma.
const MESES_ANTES = 1;
const MESES_DESPUES = 4;
const primerDiaDelMes = (ts, salto = 0) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + salto, 1).setHours(0, 0, 0, 0);
};

function rangeOf(sprint, tasks) {
  const fechas = [sprint.start, sprint.due];
  for (const t of tasks) { if (t.startDate) fechas.push(t.startDate); if (t.dueDate) fechas.push(t.dueDate); }
  const validas = fechas.filter(Boolean).map(startOfDay);
  // Sin ninguna fecha, el cronograma se ancla en el mes actual.
  const min = validas.length ? Math.min(...validas) : startOfDay(new Date().getTime());
  const max = validas.length ? Math.max(...validas) : min;
  const from = primerDiaDelMes(min, -MESES_ANTES);
  const to = addDays(primerDiaDelMes(max, MESES_DESPUES + 1), -1); // último día del mes
  const days = Math.round((to - from) / DAY) + 1;
  return { from, to, days };
}

// `colorPorFila` y `readOnly` permiten reutilizar este mismo cronograma para el
// timeline global de proyectos: allí cada fila es un proyecto, con el color de
// su cliente (`t.client` / `t.colorKey`) y un enlace a su tablero (`t.href`),
// en vez de una tarea con estado editable. Va por datos y no por funciones:
// una página de servidor no puede pasarle callbacks a un componente cliente.
export default function SprintGantt({
  sprint,
  tasks = [],
  statuses = [],
  isAdmin = false,
  myEmail = null,
  back = null,
  colorPorFila = false,
  readOnly = false,
  footer = null,
  controls = null,
  titleExtra = null,
  now = null,
}) {
  // Cambios de estado hechos aquí: se pintan al momento y se revierten si la
  // llamada a ClickUp falla.
  const [overrides, setOverrides] = useState(() => new Map());
  const [panel, setPanel] = useState(null); // { task, x, y } — tarjeta al hacer clic
  const [zoom, setZoom] = useState("dia");
  const [person, setPerson] = useState(TODOS); // solo admin
  const [soloMias, setSoloMias] = useState(false);
  const scroller = useRef(null);
  // Tooltip propio: el `title` del navegador es lento, feo y no se puede diseñar.
  const [tip, setTip] = useState(null); // { task, x, y } — al pasar el ratón
  // Estado efectivo de una tarea (con el cambio optimista aplicado).
  const conEstado = useCallback((t) => ({ ...t, ...(overrides.get(t.id) ?? {}) }), [overrides]);
  const cambiarEstado = async (t, st) => {
    const previo = overrides.get(t.id);
    setOverrides((m) => new Map(m).set(t.id, { status: st.status, statusType: st.type, statusColor: st.color }));
    setPanel(null);
    const res = await setClickUpTaskStatus(t.id, st.status);
    if (!res?.ok) {
      setOverrides((m) => {
        const n = new Map(m);
        if (previo) n.set(t.id, previo); else n.delete(t.id);
        return n;
      });
    }
  };
  // Una sola lectura del reloj por render. En una vista servida sin sesión el
  // "hoy" llega del servidor, para que no dependa del reloj de quien mira.
  const hoy = useMemo(() => startOfDay(now ?? new Date().getTime()), [now]);
  const people = useMemo(() => {
    const m = new Map();
    for (const t of tasks) for (const a of t.assignees ?? []) if (a.name) m.set(a.name, a);
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [tasks]);

  const visibles = useMemo(() => {
    // Las cerradas no se ocultan: en un cronograma lo ya hecho también cuenta.
    // Se dibujan apagadas (ver barStyle) para que no compitan con lo vivo.
    const list = tasks.map(conEstado).filter(
      (t) =>
        (!isAdmin || person === TODOS || (t.assignees ?? []).some((a) => a.email === person)) &&
        (!soloMias || t.everyone || (t.assignees ?? []).some((a) => a.email === myEmail))
    );
    // Por fecha de inicio: un cronograma se lee en diagonal, de arriba a abajo.
    return list.sort((a, b) => (a.startDate ?? a.dueDate ?? Infinity) - (b.startDate ?? b.dueDate ?? Infinity));
  }, [tasks, person, soloMias, isAdmin, myEmail, conEstado]);

  const range = useMemo(() => rangeOf(sprint, visibles), [sprint, visibles]);
  const px = ZOOM[zoom].px;
  const width = range ? range.days * px : 0;
  const x = (ts) => ((startOfDay(ts) - range.from) / DAY) * px;

  // Al abrir, deja "hoy" a la vista en lugar del principio del rango.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !range) return;
    const left = x(hoy) - el.clientWidth / 3;
    el.scrollLeft = Math.max(0, left);
    // solo al montar y al cambiar el zoom
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, range?.from]);

  const dias = useMemo(() => (range ? Array.from({ length: range.days }, (_, i) => addDays(range.from, i)) : []), [range]);
  // Cabecera de meses: una etiqueta por mes con su ancho real.
  const meses = useMemo(() => {
    const out = [];
    for (const d of dias) {
      const key = `${new Date(d).getFullYear()}-${new Date(d).getMonth()}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.days++;
      else out.push({ key, ts: d, days: 1 });
    }
    return out;
  }, [dias]);

  const hechas = tasks.map(conEstado).filter(cerrada).length;
  const col = paletteColor(sprint.client || sprint.name, sprint.colorKey);
  // En un sprint todas las barras comparten el color del proyecto; en el
  // timeline global cada fila es un proyecto y lleva el de su cliente.
  // `t.color` manda: el timeline lo tiñe por estado con tokens del sistema, no
  // por cliente. Sin él se cae al color del cliente y, si no, al del sprint.
  const colorDe = (t) => t.color ?? (colorPorFila ? paletteColor(t.client || t.name, t.colorKey) : col);

  return (
    // Alto de la ventana menos el aire del layout: el scroll vive dentro.
    <div className="flex flex-col h-dvh -mt-8 md:-mt-10 -mb-[calc(58px+env(safe-area-inset-bottom)+1.75rem)] md:-mb-10">
      {/* Una sola barra: identidad a la izquierda, controles a la derecha. */}
      <header className="shrink-0 border-b border-border/60 px-5 md:px-10 py-3 flex items-center gap-x-5 gap-y-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {back}
          <span className="h-4 w-px bg-border/70 shrink-0" aria-hidden />
          <h1 className="font-display text-[19px] leading-none text-ink truncate">{sprint.name}</h1>
          {sprint.client && (
            <span
              className="shrink-0 inline-flex items-center h-5 px-2 rounded-full text-[11.5px] font-medium"
              style={{ background: col.bg, color: col.fg }}
            >
              {sprint.client}
            </span>
          )}
          {sprint.start && sprint.due && (
            <span className="hidden lg:block text-micro text-mutedSoft shrink-0">{rangoTexto(sprint.start, sprint.due)}</span>
          )}
          {titleExtra}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {tasks.length > 0 && !readOnly && (
            <div className="hidden sm:flex items-center gap-2.5">
              <ProgressBar value={hechas} max={tasks.length} className="w-[80px]" />
              <span className="text-micro text-mutedSoft tabular-nums">{hechas}/{tasks.length}</span>
            </div>
          )}
          {controls}
          <Tabs
            value={zoom}
            onChange={setZoom}
            tabs={Object.entries(ZOOM).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <button
            type="button"
            onClick={() => { const el = scroller.current; if (el && range) el.scrollTo({ left: Math.max(0, x(hoy) - el.clientWidth / 3), behavior: "smooth" }); }}
            // Con caja en reposo: es una acción, no una etiqueta, y sin
            // contorno pasaba por texto suelto hasta que el ratón lo cruzaba.
            className="h-8 px-2.5 rounded-lg border border-border bg-surface2/40 text-[12.5px] text-muted hover:text-ink hover:bg-surface2/80 hover:border-borderStrong transition"
          >
            Hoy
          </button>
          {!readOnly && (
          <PersonFilter
            isAdmin={isAdmin && people.length > 1}
            members={people.map((p) => ({ email: p.email, name: p.name }))}
            value={person === TODOS ? "" : person}
            onChange={(email) => setPerson(email || TODOS)}
            myEmail={myEmail}
            mine={soloMias}
            onToggleMine={() => setSoloMias((v) => !v)}
          />
          )}
        </div>
      </header>

      {!range || visibles.length === 0 ? (
        <div className="flex-1 grid place-items-center px-5 md:px-10">
          <p className="text-small text-mutedSoft text-center">
            {tasks.length === 0
              ? readOnly ? "No hay proyectos con fechas." : "Este sprint aún no tiene tareas."
              : "Ninguna tarea con estos filtros."}
          </p>
        </div>
      ) : (
        <div ref={scroller} className="flex-1 overflow-auto">
          <div className="w-max min-w-full min-h-full flex flex-col">
            {/* Cabecera del calendario, pegada arriba al hacer scroll vertical */}
            <div className="sticky top-0 z-20 bg-bg border-b border-border/60">
              <div className="flex-1" style={{ minWidth: width }}>
                <div className="flex h-6">
                  {meses.map((m, i) => {
                    const d = new Date(m.ts);
                    // El año, solo al saltar de uno a otro. En el primer mes se
                    // sobreentiende y solo añadía ruido.
                    const nuevoAño = i > 0 && d.getFullYear() !== new Date(meses[i - 1].ts).getFullYear();
                    return (
                      <div key={m.key} style={{ width: m.days * px }} className="relative shrink-0 border-r border-border/40 leading-6">
                        {/* Sticky: el mes acompaña al scroll mientras quede
                            alguno de sus días en pantalla. */}
                        <span className="sticky left-2 inline-block px-0.5 text-[12px] font-medium text-ink capitalize whitespace-nowrap">
                          {d.toLocaleDateString("es-ES", { month: "long" })}
                          {nuevoAño && <span className="text-mutedSoft font-normal"> {d.getFullYear()}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex h-6">
                  {dias.map((d) => (
                    <div
                      key={d}
                      style={{ width: px }}
                      className={cn(
                        "shrink-0 grid place-items-center h-6 text-[10px] tabular-nums",
                        isWeekend(d) ? "text-mutedSoft/50" : "text-mutedSoft"
                      )}
                    >
                      {d === hoy ? (
                        <span className="grid place-items-center h-[18px] min-w-[18px] px-1 rounded-full bg-danger text-bg font-medium">
                          {new Date(d).getDate()}
                        </span>
                      ) : zoom === "dia" ? (
                        new Date(d).getDate()
                      ) : new Date(d).getDay() === 1 ? (
                        new Date(d).getDate()
                      ) : (
                        ""
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filas */}
            <div className="relative flex-1">
              {/* Fondo del calendario: fines de semana y separadores de semana.
                  Va detrás de todas las filas y llega hasta el borde inferior. */}
              <div className="absolute inset-0 flex pointer-events-none" aria-hidden>
                {dias.map((d) => (
                  <div
                    key={d}
                    // La rejilla se adapta a la escala: en días, cada semana y
                    // los findes tramados; en semanas, solo la línea semanal;
                    // en meses, solo el corte de mes. Si no, es un rayado.
                    className={cn(
                      "shrink-0",
                      zoom !== "mes" && new Date(d).getDay() === 1 && "border-l border-border/40",
                      zoom === "mes" && new Date(d).getDate() === 1 && "border-l border-border/40"
                    )}
                    style={{
                      width: px,
                      ...(zoom === "dia" && isWeekend(d)
                        ? {
                            backgroundImage:
                              "repeating-linear-gradient(45deg, rgb(var(--ct-surface2) / 0.9) 0 5px, transparent 5px 10px)",
                          }
                        : null),
                    }}
                  />
                ))}
              </div>
              {visibles.map((t) => {
                const fin = t.dueDate ?? null;
                const ini = t.startDate && t.startDate < (fin ?? Infinity) ? t.startDate : fin;
                // En una TAREA, vencida es pasarse de fecha sin cerrarla. En un
                // PROYECTO no hay estado que cerrar: se pasa de fecha con
                // trabajo vivo dentro, y eso lo sabe quien monta la fila.
                const vencida = readOnly ? Boolean(t.fueraDePlazo) : fin && startOfDay(fin) < hoy && !cerrada(t);
                return (
                  <div key={t.id} className="relative flex border-b border-border/30 hover:bg-surface2/20 transition-colors">
                    {/* El timeline global respira más: la fila es una franja de
                        proyecto, no un renglón de tarea. */}
                    <div className={cn("relative flex-1", readOnly ? "h-14" : "h-11")} style={{ minWidth: width }}>
                      {fin ? (() => {
                        // Mínimo 64px: por debajo, dentro de la barra no cabe ni una sílaba.
                        const w = Math.max(x(fin) - x(ini) + px, 64);
                        // Sitio que se llevan avance y caras, para que el nombre
                        // se recorte antes de meterse debajo: los dos son
                        // `sticky` y, sin reservarlo, se pisan al hacer scroll.
                        // En una barra corta no cabe todo: lo accesorio se cae
                        // por orden inverso de utilidad, para que nunca se
                        // desborde. El cliente y el estado aguantan hasta el
                        // final; el nombre se recorta.
                        const cabenCaras = !readOnly || w >= 210;
                        const cabeMeta = !readOnly || w >= 140;
                        const caras = cabenCaras
                          ? (t.equipo ? 1 : 0) + Math.min((t.assignees ?? []).length, readOnly ? 4 : 1)
                          : 0;
                        const tag = readOnly ? t.client : null;
                        const reservado =
                          28 +
                          (t.meta && cabeMeta ? 44 : 0) +
                          (caras ? (caras - 1) * 14 + 20 + 8 : 0) +
                          (tag ? tag.length * 6.2 + 20 : 0) +
                          (t.completado ? 22 : 0);
                        return (
                          <Bar
                            as={readOnly && t.href ? "a" : "button"}
                            href={readOnly && t.href ? t.href : undefined}
                            onClick={readOnly ? undefined : (ev) => {
                              const r = ev.currentTarget.getBoundingClientRect();
                              setTip(null);
                              setPanel({ task: t, ini, fin, x: r.left + r.width / 2, y: r.top });
                            }}
                            onMouseEnter={(ev) => {
                              const r = ev.currentTarget.getBoundingClientRect();
                              setTip({ task: t, ini, fin, x: r.left + r.width / 2, y: r.top });
                            }}
                            onMouseLeave={() => setTip(null)}
                            className={cn(
                              "absolute top-1/2 -translate-y-1/2 border flex items-center pl-3 pr-1 transition hover:brightness-[0.97]",
                              readOnly ? "h-9 rounded-xl pr-2 gap-2 overflow-hidden" : "h-7 rounded-full",
                              !readOnly && vencida && "ring-1 ring-danger/70"
                            )}
                            style={{ left: x(ini), width: w, ...barStyle(t, colorDe(t), readOnly).style }}
                          >
                            {/* En el timeline los tres datos que identifican la
                                fila —cliente, quién la trabaja y el nombre— van
                                en UN bloque sticky: si cada uno se pegara por su
                                cuenta al borde, acabarían montándose entre ellos
                                al hacer scroll sobre una barra larga. */}
                            {readOnly ? (
                              <span className="sticky left-3 flex items-center gap-2 min-w-0">
                                {t.completado && (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="shrink-0 h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-label="Completado"
                                  >
                                    <title>Completado</title>
                                    <path d="M20 6 9 17l-5-5" />
                                  </svg>
                                )}
                                {tag && (
                                  <span
                                    className="shrink-0 inline-flex items-center h-5 px-1.5 rounded-md text-[10.5px] font-medium leading-none whitespace-nowrap"
                                    style={{
                                      background: colorDe(t).tagBg ?? `${colorDe(t).fg}1f`,
                                      color: colorDe(t).fg,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                )}
                                {/* Fase del proyecto: un punto basta, el estado
                                    entero va en el tooltip. */}
                                {t.phase && (
                                  <span
                                    title={t.phase.estado}
                                    className={cn(
                                      "shrink-0 h-1.5 w-1.5 rounded-full",
                                      FASE_PUNTO[t.phase.key] ?? "bg-mutedSoft"
                                    )}
                                  />
                                )}
                                {/* Lo del equipo se marca con la casa: no hay
                                    una persona que lo lleve, lo llevamos todos. */}
                                {cabenCaras && t.equipo && (
                                  <span
                                    title="Proyecto del equipo"
                                    className="shrink-0 grid place-items-center h-5 w-5 rounded-full bg-bg/70 ring-2 ring-bg"
                                  >
                                    <FctsAsterisk className="h-2.5 w-2.5" />
                                  </span>
                                )}
                                {cabenCaras && (t.assignees ?? []).length > 0 && (
                                  <span className="shrink-0 flex items-center">
                                    {(t.assignees ?? []).slice(0, 4).map((a) => (
                                      <Cara key={a.email ?? a.name} a={a} readOnly />
                                    ))}
                                  </span>
                                )}
                                <span
                                  className="text-[12px] leading-none font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                                  style={{ color: barStyle(t, colorDe(t), readOnly).text, maxWidth: Math.max(24, w - reservado) }}
                                >
                                  {t.name}
                                </span>
                              </span>
                            ) : (
                              <>
                                <span
                                  className="sticky left-3 text-[12px] leading-none font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                                  style={{ color: barStyle(t, colorDe(t), readOnly).text, maxWidth: w - 44 }}
                                >
                                  {t.name}
                                </span>
                                {(t.assignees ?? []).slice(0, 1).map((a) => (
                                  <Cara key={a.email ?? a.name} a={a} />
                                ))}
                              </>
                            )}
                            {/* El avance cierra la barra por la derecha, fuera
                                del bloque sticky. */}
                            {t.meta && cabeMeta && (
                              <span
                                className="ml-auto shrink-0 text-[11px] leading-none tabular-nums opacity-70 whitespace-nowrap pl-2"
                                style={{ color: barStyle(t, colorDe(t), readOnly).text }}
                              >
                                {t.meta}
                              </span>
                            )}
                          </Bar>
                        );
                      })() : null}
                      {!fin && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-micro text-mutedSoft/70">sin fecha</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Hoy, por encima de todas las filas */}
              {hoy >= range.from && hoy <= range.to && (
                <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 w-px bg-danger/50" style={{ left: x(hoy) + px / 2 }} />
              )}
            </div>
          </div>
        </div>
      )}
      {footer}

      {tip && !panel && typeof document !== "undefined" && createPortal(
        <div
          className="pointer-events-none fixed z-[120] -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y - 10 }}
        >
          <div className="max-w-[320px] rounded-xl bg-paper border border-border/70 shadow-float px-3.5 py-2.5">
            <p className="text-small text-ink leading-snug">{tip.task.name}</p>
            <p className="text-micro text-mutedSoft mt-1">
              {[
                tip.ini === tip.fin ? dm(tip.fin) : `${dm(tip.ini)} – ${dm(tip.fin)}`,
                tip.task.status,
                (tip.task.assignees ?? []).map((a) => a.name).filter(Boolean).join(", ") || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {/* Pico, para que se vea de qué barra cuelga */}
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-paper border-r border-b border-border/70" />
        </div>,
        document.body
      )}

      {panel && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setPanel(null)} />
          <div
            className="fixed z-[120] -translate-x-1/2 -translate-y-full w-[280px] rounded-2xl bg-paper border border-border/70 shadow-float p-4"
            style={{ left: panel.x, top: panel.y - 10 }}
          >
            <p className="text-small text-ink leading-snug">{panel.task.name}</p>
            <p className="text-micro text-mutedSoft mt-1">
              {panel.ini === panel.fin ? dm(panel.fin) : `${dm(panel.ini)} – ${dm(panel.fin)}`}
              {(panel.task.assignees ?? []).length > 0 &&
                ` · ${(panel.task.assignees ?? []).map((a) => a.name).filter(Boolean).join(", ")}`}
            </p>

            {statuses.length > 0 && (
              <div className="mt-3.5">
                <p className="text-micro text-mutedSoft mb-1.5">Estado</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((st) => {
                    const activo = norm(conEstado(panel.task).status) === norm(st.status);
                    return (
                      <button
                        key={st.status}
                        type="button"
                        onClick={() => cambiarEstado(panel.task, st)}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] border transition",
                          activo ? "border-transparent text-bg" : "border-border/70 text-muted hover:text-ink hover:border-borderStrong"
                        )}
                        style={activo ? { background: st.color || "var(--ct-ink)" } : undefined}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: activo ? "currentColor" : st.color || "currentColor" }} />
                        <span className="capitalize">{st.status}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {panel.task.url && (
              <a
                href={panel.task.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3.5 text-micro text-muted hover:text-ink transition"
              >
                Abrir en ClickUp
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14 3h7v7M10 14 21 3M19 13v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h7" />
                </svg>
              </a>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
