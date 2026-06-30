import PageHeader from "@/components/PageHeader";
import FichajeClient from "./fichaje-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getTimeEntries, getDayMarks, getMissingWorkdays } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";

export default async function FichajePage({ searchParams }) {
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

  const sp = await searchParams;
  const todayISO = madridDateISO();
  const month = sp?.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayISO.slice(0, 7);
  const curMonth = todayISO.slice(0, 7);

  const [entries, marks, missing] = await Promise.all([
    getTimeEntries(me.id, `${month}-01`, `${month}-31`),
    getDayMarks(me, `${month}-01`, `${month}-31`),
    getMissingWorkdays(me, `${curMonth}-01`, todayISO),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Jornada" title="Fichaje" helper="Registro horario oficial del equipo." />

      <FichajeClient
        entries={entries}
        festivos={marks.festivos}
        vacaciones={marks.vacaciones}
        birthday={me.birthday}
        missing={missing}
        month={month}
        todayISO={todayISO}
      />

      <p className="text-micro text-mutedSoft mt-4 leading-relaxed max-w-[80ch]">
        Registro de jornada conforme al art. 34.9 ET (RD-ley 8/2019): se guardan las horas exactas de
        entrada y salida, son <b>inalterables</b> (las correcciones quedan registradas, no se borran) y se
        <b> conservan 4 años</b> a disposición de la persona trabajadora, su representación legal y la
        Inspección de Trabajo.
      </p>
    </div>
  );
}
