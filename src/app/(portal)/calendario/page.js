import CalendarMonth from "@/components/CalendarMonth";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";

export default async function CalendarioPage() {
  const [events, me] = await Promise.all([getCalendarEvents(), getCurrentEmployee()]);
  return <CalendarMonth events={events} canRequest={Boolean(me)} />;
}
