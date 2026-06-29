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

  const deVacaciones = events
    .filter((e) => e.type === "vacaciones" && parse(e.start) <= now && parse(e.end) >= hoy)
    .map((e) => e.who)
    .filter(Boolean);

  const futuros = events
    .map((e) => ({ ...e, dias: diasHasta(e.start, hoy) }))
    .filter((e) => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  const proxCumple = futuros.find((e) => e.type === "cumple");
  const proxFestivo = futuros.find((e) => e.type === "festivo");
  const proxEvento = futuros[0];

  const fechaRaw = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const fecha = fechaRaw.charAt(0).toUpperCase() + fechaRaw.slice(1);

  // Una sola frase, fluida. Un único avatar (la persona de vacaciones).
  const vac =
    deVacaciones.length === 0 ? (
      <>Hoy no hay nadie de vacaciones</>
    ) : deVacaciones.length === 1 ? (
      <>Hoy <Face name={deVacaciones[0]} /> está de vacaciones</>
    ) : (
      <>Hoy {joinNodes(deVacaciones.map((n) => <Hi>{n}</Hi>))} están de vacaciones</>
    );

  const partes = [];
  if (proxCumple) {
    partes.push(
      <>{deVacaciones.length ? "el próximo cumpleaños" : ", aunque el próximo cumpleaños"} es el de <Hi>{proxCumple.who}</Hi>, {rel(proxCumple.dias)}</>
    );
  }
  if (proxFestivo) {
    partes.push(<>el siguiente festivo será <Hi>«{proxFestivo.title}»</Hi></>);
  }

  return (
    <header className="pb-2 mb-8 fade-up">
      <p className="text-caption uppercase text-mutedSoft mb-5">{fecha}</p>

      <h1 className="font-display text-[44px] md:text-[64px] leading-[1.0] tracking-[-0.03em] text-ink">
        {saludo(now.getHours())}, {nombre} <span className="inline-block align-baseline">👋</span>
      </h1>

      <p className="mt-7 text-[22px] md:text-[30px] leading-[1.4] tracking-[-0.01em] text-mutedSoft max-w-[44ch]">
        {vac}
        {partes.map((p, i) => (
          <span key={i}>
            {i === 0 ? (deVacaciones.length ? "; " : " ") : ", y "}
            {p}
          </span>
        ))}
        .
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
