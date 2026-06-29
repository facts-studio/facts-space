"use client";

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
const corto = (iso) =>
  parse(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long" });

function rel(dias) {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias < 7) return `en ${dias} días`;
  if (dias < 14) return "la semana que viene";
  return `en ${Math.round(dias / 7)} semanas`;
}

// Palabra clave resaltada (estilo landing cliente Adhōc).
const Hi = ({ children }) => <span className="text-ink font-medium">{children}</span>;

export default function TodayHero({ nombre = "equipo", events = [] }) {
  const now = new Date();
  const hoy = startOfDay(now);

  const deVacaciones = events
    .filter((e) => e.type === "vacaciones" && parse(e.start) <= now && parse(e.end) >= hoy)
    .map((e) => firstName(e.who));

  const futuros = events
    .map((e) => ({ ...e, dias: diasHasta(e.start, hoy) }))
    .filter((e) => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  const proxHito = futuros.find((e) => e.type === "hito");
  const proxCumple = futuros.find((e) => e.type === "cumple");
  const proxEvento = futuros.find((e) => e.id !== proxHito?.id);

  return (
    <header className="pb-2 mb-8 fade-up">
      <p className="text-caption uppercase text-mutedSoft mb-5">
        {(() => {
          const f = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
          return f.charAt(0).toUpperCase() + f.slice(1);
        })()}
      </p>

      <h1 className="font-display text-[44px] md:text-[64px] leading-[1.0] tracking-[-0.03em] text-ink">
        {saludo(now.getHours())}, {nombre}{" "}
        <span className="inline-block align-baseline">👋</span>
      </h1>

      <p className="mt-7 text-[22px] md:text-[31px] leading-[1.35] tracking-[-0.01em] text-mutedSoft max-w-[34ch] md:max-w-[42ch]">
        {deVacaciones.length === 0 ? (
          <>Hoy no hay nadie de vacaciones</>
        ) : deVacaciones.length === 1 ? (
          <>Hoy <Hi>{deVacaciones[0]}</Hi> está de vacaciones</>
        ) : (
          <>Hoy están de vacaciones <Hi>{deVacaciones.join(" y ")}</Hi></>
        )}
        {proxHito && (
          <>
            {" "}y el próximo hito es <Hi>«{proxHito.title}»</Hi>, {rel(proxHito.dias)}.
          </>
        )}
        {proxCumple && (
          <> Pronto celebramos el cumple de <Hi>{firstName(proxCumple.who)}</Hi>.</>
        )}
      </p>

      {/* Ahora mismo — bloque grande en superficie sutil */}
      {proxHito && (
        <div className="mt-10 rounded-[28px] bg-surface2/65 border border-border/50 p-7 md:p-10">
          <span className="inline-flex items-center gap-2 text-caption uppercase text-brandMid font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-brandMid" /> Lo más cercano
          </span>
          <h2 className="font-display text-[32px] md:text-[46px] leading-[1.02] tracking-[-0.025em] text-ink mt-4 max-w-[640px]">
            {proxHito.title}
          </h2>
          <p className="text-body-lg text-inkSoft/85 mt-4">
            {proxHito.who ? `${proxHito.who} · ` : ""}
            {rel(proxHito.dias)} · {corto(proxHito.start)}
          </p>
          {proxEvento && (
            <div className="mt-7 text-small text-muted">
              Después:{" "}
              <span className="text-ink font-medium">{proxEvento.title}</span>{" "}
              ({rel(proxEvento.dias)})
            </div>
          )}
        </div>
      )}
    </header>
  );
}
