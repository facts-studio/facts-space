"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEAM } from "@/lib/mock";
import { cn } from "@/lib/cn";
import { refreshClickUpTasks } from "@/lib/actions/clickup";
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
// Resalte de alarma (tareas vencidas).
const Warn = ({ children }) => <span className="text-danger font-medium">{children}</span>;

// Botón de recarga desde ClickUp (idéntico al de la vista Tareas).
function RefreshButton() {
  const router = useRouter();
  const [, start] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    start(async () => { await refreshClickUpTasks(); router.refresh(); setTimeout(() => setRefreshing(false), 600); });
  };
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={refreshing}
      title="Recargar desde ClickUp"
      aria-label="Recargar"
      className="h-8 w-8 grid place-items-center rounded-lg bg-surface2/70 text-mutedSoft hover:text-ink hover:bg-surface2 transition disabled:opacity-50"
    >
      <svg className={cn("h-4 w-4", refreshing && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
    </button>
  );
}
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

export default function TodayHero({ nombre = "equipo", events = [], avisos = null, taskCount = 0, overdueCount = 0 }) {
  const now = new Date();
  const hoy = startOfDay(now);

  // Solo lo que ESTÁ POR VENIR (start hoy o futuro). Quien ya está de vacaciones
  // no entra aquí (su start es pasado): eso se ve en la píldora de presencia, no
  // en el texto — el saludo anuncia lo próximo, no lo que ya pasa.
  const futuros = events
    .map((e) => ({ ...e, dias: diasHasta(e.start, hoy) }))
    .filter((e) => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  const fechaRaw = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const fecha = fechaRaw.charAt(0).toUpperCase() + fechaRaw.slice(1);

  // Eventos a mencionar, cada tipo dentro de su ventana. Una entrada de
  // vacaciones por persona (la más próxima). Máx. 3 para no alargar la frase.
  const NEAR = { vacaciones: 21, cumple: 14, festivo: 14, hito: 21 };
  const near = [];
  const vacSeen = new Set();
  for (const e of futuros) {
    const lim = NEAR[e.type];
    if (lim == null || e.dias > lim) continue;
    // Vacaciones/ausencias que ya empezaron hoy no se anuncian: se ven en la
    // píldora de presencia. En el saludo solo lo que arranca mañana o después.
    if ((e.type === "vacaciones" || e.type === "ausencia")) {
      if (e.dias < 1) continue;
      if (vacSeen.has(e.who)) continue;
      vacSeen.add(e.who);
    }
    near.push(e);
    if (near.length >= 3) break;
  }
  const hasNow = near.length > 0;

  // Relleno: próximos eventos MÁS ALLÁ de la ventana, sin repetir lo ya dicho.
  const shown = new Set(near.map((e) => e.id));
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

  // Parte del saludo por evento. El cumple de HOY se dice como tal ("hoy es el
  // cumple de X"); el resto, con su fecha.
  const parteFor = (e) =>
    e.type === "cumple" && e.dias === 0
      ? <><Ico>🎂</Ico> hoy es el cumple de <Hi>{e.who}</Hi></>
      : nodeFor(e);
  const partes = near.map(parteFor);

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
  // Las vencidas ya van dentro de taskCount; se nombran aparte porque son lo que
  // más urge. Si TODO lo pendiente está vencido, no tiene sentido decir "esta
  // semana": se habla solo de las vencidas.
  const vencidas = (n) => <><Warn>{n}</Warn> {n === 1 ? "vencida" : "vencidas"}</>;
  const tareasFrase = taskCount === 0
    ? null
    : overdueCount === taskCount
      ? <>Tienes {vencidas(overdueCount)}.</>
      : (
        <>
          Tienes <Hi>{taskCount}</Hi> {taskCount === 1 ? "tarea activa" : "tareas activas"} esta semana
          {overdueCount > 0 && <>, {vencidas(overdueCount)}</>}.
        </>
      );
  // Con agenda, "En la agenda:" ya hace de lead → nada de intro (evita repetir
  // "…la agenda. En la agenda:"). En calma, la frase de tareas sustituye al intro.
  const showIntro = hasContent && !hasNow && !tareasFrase;

  return (
    <header className="pb-2 mb-8 fade-up">
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-caption uppercase text-mutedSoft">{fecha}</p>
        <RefreshButton />
      </div>

      <h1 className="font-display text-[32px] md:text-[64px] leading-[1.05] md:leading-[1.0] tracking-[-0.03em] text-ink">
        {saludo(now.getHours())}, {nombre} <span className="inline-block align-baseline">👋</span>
      </h1>

      <p className="mt-5 md:mt-7 text-[17px] md:text-[30px] leading-[1.45] md:leading-[1.4] tracking-[-0.01em] text-mutedSoft max-w-[44ch]">
        {tareasFrase && <>{tareasFrase} </>}
        {showIntro && <>{intro} </>}
        {hasNow ? (
          <>
            En la agenda:{" "}
            {partes.map((p, i) => (
              <span key={i}>
                {i === 0 ? "" : i === partes.length - 1 ? " y " : ", "}
                {p}
              </span>
            ))}
            .
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

      {/* Avisos (fichaje, aprobaciones pendientes…) */}
      {avisos}
    </header>
  );
}
