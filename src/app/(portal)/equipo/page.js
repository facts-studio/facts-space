import EquipoView from "./equipo-view";
import { getEmployees } from "@/lib/data/employees";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getApprovedVacationDays } from "@/lib/data/admin";
import { madridDateISO } from "@/lib/dates";

export default async function EquipoPage() {
  const year = Number(madridDateISO().slice(0, 4));
  const [team, events, vacUsed] = await Promise.all([
    getEmployees(),
    getCalendarEvents(),
    getApprovedVacationDays(year),
  ]);
  return <EquipoView team={team} events={events} vacUsed={vacUsed} year={year} />;
}
