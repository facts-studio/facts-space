import PageHeader from "@/components/PageHeader";
import CalendarMonth from "@/components/CalendarMonth";
import { EVENTS } from "@/lib/mock";

export default function CalendarioPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Equipo"
        title="Calendario"
        helper="Hitos, cumpleaños, vacaciones y festivos del equipo. Clica un día para ver el detalle."
      />
      <CalendarMonth events={EVENTS} />
    </div>
  );
}
