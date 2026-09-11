import EquipoView from "./equipo-view";
import { getEmployees } from "@/lib/data/employees";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getApprovedVacationDays } from "@/lib/data/admin";
import { madridDateISO } from "@/lib/dates";
import { getCurrentEmployee } from "@/lib/data/helpers";
import SinAcceso from "@/components/SinAcceso";
import { isColaborador } from "@/lib/team";

export default async function EquipoPage() {
  if (isColaborador(await getCurrentEmployee())) {
    return (
      <SinAcceso kicker="Estudio" title="Equipo">
        La ficha del equipo es interna. Si necesitas contactar con alguien de un proyecto, lo tienes
        en el propio proyecto.
      </SinAcceso>
    );
  }
  const year = Number(madridDateISO().slice(0, 4));
  const [team, events, vacUsed] = await Promise.all([
    getEmployees(),
    getCalendarEvents(),
    getApprovedVacationDays(year),
  ]);
  return <EquipoView team={team} events={events} vacUsed={vacUsed} year={year} />;
}
