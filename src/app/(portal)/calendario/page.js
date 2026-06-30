import CalendarMonth from "@/components/CalendarMonth";
import { getCalendarEvents } from "@/lib/data/calendar";

export default async function CalendarioPage() {
  const events = await getCalendarEvents();
  return <CalendarMonth events={events} />;
}
