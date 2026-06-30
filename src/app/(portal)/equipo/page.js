import EquipoView from "./equipo-view";
import { getEmployees } from "@/lib/data/employees";
import { getCalendarEvents } from "@/lib/data/calendar";

export default async function EquipoPage() {
  const [team, events] = await Promise.all([getEmployees(), getCalendarEvents()]);
  return <EquipoView team={team} events={events} />;
}
