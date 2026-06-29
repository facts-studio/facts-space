"use client";

import { EVENT_TYPES, TEAM } from "@/lib/mock";

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

export default function TodayHero({ nombre = "equipo", events = [] }) {
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
      <><Ico>🏖️</Ico> Hoy {joinNodes(deVacaciones.map((n) => <Hi>{n}</Hi>))} están de vacaciones</>
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

  return (
    <header className="pb-2 mb-8 fade-up">
      <p className="text-caption uppercase text-mutedSoft mb-5">{fecha}</p>

      <h1 className="font-display text-[44px] md:text-[64px] leading-[1.0] tracking-[-0.03em] text-ink">
        {saludo(now.getHours())}, {nombre} <span className="inline-block align-baseline">👋</span>
      </h1>

      <p className="mt-7 text-[22px] md:text-[30px] leading-[1.4] tracking-[-0.01em] text-mutedSoft max-w-[44ch]">
        {deVacaciones.length === 0 && partes.length === 0 ? (
          <>Nada en la agenda por ahora. Buen momento para avanzar con calma.</>
        ) : (
          <>
            {vac}
            {partes.map((p, i) => (
              <span key={i}>
                {i === 0 ? "; " : i === partes.length - 1 ? ", y " : ", "}
                {p}
              </span>
            ))}
            .
          </>
        )}
      </p>

      {/* Lo más cercano */}
      {proxEvento && (
        <div className="mt-10 rounded-[28px] bg-surface2/65 border border-border/50 p-7 md:p-10">
          <span className="inline-flex items-center gap-2 text-caption uppercase text-brandMid font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-brandMid" /> Lo más cercano
          </span>
          <h2 className="font-display text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.025em] text-ink mt-4 flex items-center gap-3 max-w-[640px]">
            {proxEvento.who && MEMBER.get(proxEvento.who)?.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={MEMBER.get(proxEvento.who).photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            )}
            {proxEvento.title}
          </h2>
          <p className="text-body-lg text-inkSoft/85 mt-3">
            {EVENT_TYPES[proxEvento.type].label} · {rel(proxEvento.dias)} · {corto(proxEvento.start)}
          </p>
        </div>
      )}
    </header>
  );
}
