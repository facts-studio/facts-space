import CalendarMonth from "@/components/CalendarMonth";
import { EVENTS } from "@/lib/mock";

export default function CalendarioPage() {
  return <CalendarMonth events={EVENTS} />;
}
