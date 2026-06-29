import PageHeader from "@/components/PageHeader";
import CalendarMonth from "@/components/CalendarMonth";
import { EVENTS } from "@/lib/mock";

export default function CalendarioPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Equipo"
        title="Calendario"
        helper="Hitos, cumpleaños, vacaciones y festivos del equipo. Clica un día para ver el detalle."
      />
      <CalendarMonth events={EVENTS} />
    </div>
  );
}
