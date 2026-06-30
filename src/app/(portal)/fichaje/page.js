import PageHeader from "@/components/PageHeader";
import ClockButton from "./clock-button";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getTimeEntries, getOpenEntry } from "@/lib/data/time";
import { madridDateISO, madridTime, formatDuration } from "@/lib/dates";

const dur = (e) => (e.clock_out ? new Date(e.clock_out) - new Date(e.clock_in) : 0);

function fmtDayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const s = new Date(y, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function FichajePage() {
  const me = await getCurrentEmployee();

  if (!me) {
    return (
      <div>
        <PageHeader eyebrow="Jornada" title="Fichaje" helper="Registro horario del equipo." />
        <div className="card p-6 text-small text-muted">
          Tu cuenta no está dada de alta como empleado. Pide a administración que te añada para poder fichar.
        </div>
      </div>
    );
  }

  const todayISO = madridDateISO();
  const [yyyy, mm] = todayISO.split("-");
  const monthStart = `${yyyy}-${mm}-01`;
  const monthEnd = `${yyyy}-${mm}-31`;

  const [entries, open] = await Promise.all([
    getTimeEntries(me.id, monthStart, monthEnd),
    getOpenEntry(me.id),
  ]);

  // Inicio de la semana actual (lunes) en ISO.
  const t = new Date(todayISO + "T00:00:00");
  const weekStartDate = new Date(t);
  weekStartDate.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const weekStartISO = madridDateISO(weekStartDate);

  const closedTodayMs = entries.filter((e) => e.work_date === todayISO && e.clock_out).reduce((s, e) => s + dur(e), 0);
  const weekMs = entries.filter((e) => e.work_date >= weekStartISO && e.clock_out).reduce((s, e) => s + dur(e), 0);
  const monthMs = entries.filter((e) => e.clock_out).reduce((s, e) => s + dur(e), 0);

  // Agrupa por día (descendente) para el histórico.
  const byDay = new Map();
  for (const e of entries) {
    if (!byDay.has(e.work_date)) byDay.set(e.work_date, []);
    byDay.get(e.work_date).push(e);
  }
  const days = [...byDay.keys()].sort().reverse();

  const monthLabel = new Date(Number(yyyy), Number(mm) - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className="max-w-[920px]">
      <PageHeader eyebrow="Jornada" title="Fichaje" helper="Registro horario oficial del equipo." />

      <ClockButton open={open} closedTodayMs={closedTodayMs} />

      {/* Resumen semana / mes */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="card p-5">
          <p className="section-eyebrow mb-2">Esta semana</p>
          <p className="font-display text-[26px] leading-none text-ink tabular-nums">{formatDuration(weekMs)}</p>
        </div>
        <div className="card p-5">
          <p className="section-eyebrow mb-2 capitalize">{monthLabel}</p>
          <p className="font-display text-[26px] leading-none text-ink tabular-nums">{formatDuration(monthMs)}</p>
        </div>
      </div>

      {/* Histórico del mes */}
      <div className="card p-6 mt-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-ink capitalize">{monthLabel}</h2>
          <a
            href={`/api/fichaje/export?month=${yyyy}-${mm}`}
            className="text-small text-muted hover:text-ink transition inline-flex items-center gap-1.5"
          >
            ↓ Exportar CSV
          </a>
        </div>

        {days.length === 0 ? (
          <div className="rounded-2xl border border-borderStrong/40 px-4 py-10 text-center text-[13px] text-mutedSoft">
            Sin fichajes este mes
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {days.map((d) => {
              const list = byDay.get(d);
              const total = list.reduce((s, e) => s + dur(e), 0);
              return (
                <li key={d} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-small text-ink capitalize">{fmtDayLabel(d)}</p>
                    <p className="text-micro text-mutedSoft mt-0.5">
                      {list.map((e, i) => (
                        <span key={e.id}>
                          {i > 0 && " · "}
                          {madridTime(e.clock_in)}–{e.clock_out ? madridTime(e.clock_out) : "en curso"}
                        </span>
                      ))}
                    </p>
                  </div>
                  <span className="text-small text-ink tabular-nums shrink-0">{formatDuration(total)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-micro text-mutedSoft mt-4 leading-relaxed max-w-[70ch]">
        Registro de jornada conforme al art. 34.9 ET (RD-ley 8/2019): se guardan las horas exactas de
        entrada y salida, son <b>inalterables</b> (las correcciones quedan registradas, no se borran) y se
        <b> conservan 4 años</b> a disposición de la persona trabajadora, su representación legal y la
        Inspección de Trabajo.
      </p>
    </div>
  );
}
