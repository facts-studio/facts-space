"use client";

import { TEAM } from "@/lib/mock";
import LoMasCercano from "@/components/LoMasCercano";

const MEMBER = new Map(TEAM.map((m) => [m.name, m]));

function saludo(h) {
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parse = (iso) => new Date(iso + "T00:00:00");
const diasHasta = (iso, hoy) => Math.round((startOfDay(parse(iso)) - hoy) / DAY);
const firstName = (s) => (s || "").split(" ")[0];
const corto = (iso) => parse(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
const diaMes = (iso) => {
  const d = parse(iso);
  return { day: d.getDate(), month: d.toLocaleDateString("es-ES", { month: "long" }) };
};

function rel(dias) {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias < 7) return `en ${dias} días`;
  if (dias < 14) return "la semana que viene";
  if (dias < 31) return `en ${Math.round(dias / 7)} semanas`;
  if (dias < 60) return "el mes que viene";
  return `en ${Math.round(dias / 30)} meses`;
}

// Avatar en línea con el texto (escala con el tamaño de fuente).
function Face({ name }) {
  const m = MEMBER.get(name);
  if (!m) return <Hi>{name}</Hi>;
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      {m.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.photo}
          alt=""
          className="inline-block w-[0.95em] h-[0.95em] rounded-full object-cover align-[-0.12em] mr-[0.25em] ring-1 ring-border"
        />
      )}
      <Hi>{name}</Hi>
    </span>
  );
}
const Hi = ({ children }) => <span className="text-ink font-medium">{children}</span>;
// Emoji inline, un punto más pequeño que el texto.
const Ico = ({ children }) => <span className="text-[0.8em] align-[0.04em]">{children}</span>;

// Une elementos con comas y "y" final, conservando nodos React.
function joinNodes(nodes) {
  return nodes.map((n, i) => (
    <span key={i}>
      {i > 0 && (i === nodes.length - 1 ? " y " : ", ")}
      {n}
    </span>
  ));
}

export default function TodayHero({ nombre = "equipo", events = [], fichajeReminder = null, taskCount = 0 }) {
  const now = new Date();
  const hoy = startOfDay(now);

  const vacHoy = events.filter(
    (e) => e.type === "vacaciones" && parse(e.start) <= now && parse(e.end) >= hoy
  );
  const deVacaciones = vacHoy.map((e) => e.who).filter(Boolean);

  const futuros = events
    .map((e) => ({ ...e, dias: diasHasta(e.start, hoy) }))
    .filter((e) => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  // Solo mencionamos lo cercano: cumple/festivo dentro de ~2 semanas, hito ~3.
  const NEAR_CUMPLE = 14, NEAR_FESTIVO = 14, NEAR_HITO = 21;
  const proxCumple = futuros.find((e) => e.type === "cumple" && e.dias <= NEAR_CUMPLE);
  const proxFestivo = futuros.find((e) => e.type === "festivo" && e.dias <= NEAR_FESTIVO);
  const proxHito = futuros.find((e) => e.type === "hito" && e.dias <= NEAR_HITO);
  const proxEvento = futuros[0];

  const fechaRaw = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const fecha = fechaRaw.charAt(0).toUpperCase() + fechaRaw.slice(1);

  // Una sola frase, fluida. Iconos (no fotos) y fechas concretas.
  const vacEnd = vacHoy[0] && diasHasta(vacHoy[0].end, hoy) > 0 ? corto(vacHoy[0].end) : null;
  const vac =
    deVacaciones.length === 0 ? (
      <><Ico>🏖️</Ico> Hoy no hay nadie de vacaciones</>
    ) : deVacaciones.length === 1 ? (
      <>
        <Ico>🏖️</Ico> Hoy <Hi>{deVacaciones[0]}</Hi> está de vacaciones
        {vacEnd && <> hasta el <Hi>{vacEnd}</Hi></>}
      </>
    ) : (
      <><Ico>🏖️</Ico> Hoy {joinNodes(deVacaciones.map((n) => <Hi key={n}>{n}</Hi>))} están de vacaciones</>
    );

  const partes = [];
  if (proxHito) {
    partes.push(
      <><Ico>🎯</Ico> el próximo hito es <Hi>«{proxHito.title}»</Hi>, el <Hi>{corto(proxHito.start)}</Hi></>
    );
  }
  if (proxCumple) {
    const cumpleHoy = proxCumple.dias === 0;
    partes.push(
      cumpleHoy ? (
        <><Ico>🎂</Ico> hoy es el cumple de <Hi>{proxCumple.who}</Hi></>
      ) : (
        <><Ico>🎂</Ico> el cumple de <Hi>{proxCumple.who}</Hi> es {rel(proxCumple.dias)} ({corto(proxCumple.start)})</>
      )
    );
  }
  if (proxFestivo) {
    partes.push(
      <><Ico>🗓️</Ico> {proxFestivo.dias === 0 ? <>hoy es festivo: <Hi>«{proxFestivo.title}»</Hi></> : <>el {proxFestivo.dias === 1 ? "mañana" : corto(proxFestivo.start)} es festivo (<Hi>«{proxFestivo.title}»</Hi>)</>}</>
    );
  }

  // Hay algo "de ahora"? (vacaciones hoy o eventos dentro de la ventana)
  const hasNow = deVacaciones.length > 0 || partes.length > 0;

  // Relleno: próximos eventos MÁS ALLÁ de la ventana, sin repetir lo ya dicho.
  const shown = new Set([proxCumple?.id, proxFestivo?.id, proxHito?.id, ...vacHoy.map((e) => e.id)].filter(Boolean));
  const fill = futuros.filter((e) => e.dias > 0 && !shown.has(e.id)).slice(0, 2);

  // skipIcon: omite el emoji cuando el evento anterior es del mismo tipo (no
  // repetir 🏖️ 🏖️ seguidos).
  const ICON = { cumple: "🎂", festivo: "🗓️", hito: "🎯", vacaciones: "🏖️" };
  // Rango de un evento: "el 2 de julio" (un día) o "del 2 al 6 de julio" /
  // "del 2 de julio al 3 de agosto" (varios). Se usa para dar la duración de
  // las vacaciones cuando abarcan más de un día.
  const rango = (e) => {
    if (!e.end || e.end === e.start) return <>el <Hi>{corto(e.start)}</Hi></>;
    const a = diaMes(e.start), b = diaMes(e.end);
    if (a.month === b.month) return <>del <Hi>{a.day}</Hi> al <Hi>{b.day} de {b.month}</Hi></>;
    return <>del <Hi>{corto(e.start)}</Hi> al <Hi>{corto(e.end)}</Hi></>;
  };
  const nodeFor = (e, skipIcon = false) => {
    const ico = skipIcon ? null : <><Ico>{ICON[e.type]}</Ico> </>;
    if (e.type === "cumple") return <>{ico}el cumple de <Hi>{e.who}</Hi> el <Hi>{corto(e.start)}</Hi></>;
    if (e.type === "festivo") return <>{ico}el festivo <Hi>«{e.title}»</Hi> el <Hi>{corto(e.start)}</Hi></>;
    if (e.type === "hito") return <>{ico}el hito <Hi>«{e.title}»</Hi> el <Hi>{corto(e.start)}</Hi></>;
    return <>{ico}las vacaciones de <Hi>{e.who}</Hi> {rango(e)}</>;
  };

  // Agrupa eventos consecutivos de la misma persona (p. ej. dos tramos de
  // vacaciones de Carla) para no repetir "las vacaciones de Carla … Carla …".
  const groupFill = (items) => {
    const groups = [];
    for (const e of items) {
      const last = groups[groups.length - 1];
      if (last && last.type === e.type && e.type === "vacaciones" && last.who === e.who) {
        last.events.push(e);
      } else {
        groups.push({ type: e.type, who: e.who, title: e.title, events: [e] });
      }
    }
    return groups;
  };
  // "el 2 y el 6 de julio" cuando comparten mes; si no, fechas completas.
  const fechasNode = (evs) => {
    const parts = evs.map((e) => diaMes(e.start));
    if (evs.length > 1 && parts.every((p) => p.month === parts[0].month)) {
      return <>el {joinNodes(parts.map((p) => <Hi key={p.day}>{p.day}</Hi>))} de {parts[0].month}</>;
    }
    return joinNodes(evs.map((e) => <>el <Hi>{corto(e.start)}</Hi></>));
  };
  const nodeForGroup = (g, skipIcon = false) => {
    const ico = skipIcon ? null : <><Ico>{ICON[g.type]}</Ico> </>;
    if (g.type === "cumple") return <>{ico}el cumple de <Hi>{g.who}</Hi> {fechasNode(g.events)}</>;
    if (g.type === "festivo") return <>{ico}el festivo <Hi>«{g.title}»</Hi> {fechasNode(g.events)}</>;
    if (g.type === "hito") return <>{ico}el hito <Hi>«{g.title}»</Hi> {fechasNode(g.events)}</>;
    // Vacaciones: un solo tramo → rango con duración; varios → fechas de inicio.
    if (g.events.length === 1) return <>{ico}las vacaciones de <Hi>{g.who}</Hi> {rango(g.events[0])}</>;
    return <>{ico}las vacaciones de <Hi>{g.who}</Hi> {fechasNode(g.events)}</>;
  };

  // Concordancia de "será/serán": plural si hay más de un evento o si el único
  // es de tipo vacaciones ("las vacaciones … serán").
  const seraVerbo = (items) =>
    items.length > 1 || (items.length === 1 && items[0].type === "vacaciones") ? "serán" : "será";

  // Una sola entradilla que va variando (determinista por fecha). Sin coletilla
  // de cierre: el contenido cierra solo, más natural.
  const hasContent = hasNow || fill.length > 0;
  const seed = now.getFullYear() + now.getMonth() * 31 + now.getDate();
  const pick = (arr) => arr[seed % arr.length];
  const INTROS_NOW = [
    "Esto es lo que se cuece estos días.",
    "Un vistazo rápido a la agenda.",
    "Esto es lo que tenemos por aquí.",
  ];
  const INTROS_CALM = [
    "De momento, tranquilo por aquí.",
    "Poca cosa inmediata, pero atentos.",
    "No tenemos nada urgente ahora mismo.",
  ];
  const intro = hasNow ? pick(INTROS_NOW) : pick(INTROS_CALM);
  // Frase de tareas activas de la persona esta semana (sin nombrarlas).
  const tareasFrase = taskCount > 0
    ? <>Tienes <Hi>{taskCount}</Hi> {taskCount === 1 ? "tarea activa" : "tareas activas"} esta semana.</>
    : null;
  // Si hay tareas y nada "ahora mismo", la frase de tareas sustituye al intro de calma.
  const showIntro = hasContent && !(tareasFrase && !hasNow);

  return (
    <header className="pb-2 mb-8 fade-up">
      <p className="text-caption uppercase text-mutedSoft mb-5">{fecha}</p>

      <h1 className="font-display text-[44px] md:text-[64px] leading-[1.0] tracking-[-0.03em] text-ink">
        {saludo(now.getHours())}, {nombre} <span className="inline-block align-baseline">👋</span>
      </h1>

      <p className="mt-7 text-[22px] md:text-[30px] leading-[1.4] tracking-[-0.01em] text-mutedSoft max-w-[44ch]">
        {tareasFrase && <>{tareasFrase} </>}
        {showIntro && <>{intro} </>}
        {hasNow ? (
          <>
            {vac}
            {partes.map((p, i) => (
              <span key={i}>
                {i === 0 ? "; " : i === partes.length - 1 ? ", y " : ", "}
                {p}
              </span>
            ))}
            {partes.length === 0 && fill.length > 0 ? (
              <>. Después, lo próximo {seraVerbo([fill[0]])} {nodeFor(fill[0], fill[0].type === "vacaciones")}.</>
            ) : (
              "."
            )}
          </>
        ) : fill.length > 0 ? (
          (() => {
            const groups = groupFill(fill);
            return <>Lo próximo {seraVerbo(fill)} {joinNodes(groups.map((g, i) => nodeForGroup(g, i > 0 && groups[i - 1].type === g.type)))}.</>;
          })()
        ) : tareasFrase ? (
          <>Nada más señalado en la agenda; buen momento para ir avanzándolas.</>
        ) : (
          <>Parece que de momento nada más. Buen momento para avanzar con calma.</>
        )}
      </p>

      {/* Aviso de fichaje (encima de "Lo más cercano") */}
      {fichajeReminder}

      {/* Lo más cercano — agenda por día (componente reutilizable) */}
      <LoMasCercano events={events} className="mt-10" />
    </header>
  );
}
