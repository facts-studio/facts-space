import Link from "next/link";
import { Surface } from "@/components/ui";
import NavIcon from "@/components/NavIcon";
import { absenceLabel } from "@/lib/absences";

// Aviso para el responsable (o admin) cuando alguien de su equipo tiene una
// solicitud de ausencia pendiente. Mismo patrón que FichajeReminder.
// requests: [{ id, name, type, start, end, days }]
export default function AprobacionesReminder({ requests = [] }) {
  if (!requests.length) return null;

  const n = requests.length;
  const first = requests[0];
  const texto =
    n === 1
      ? `${first.name} ha solicitado ${absenceLabel(first.type).toLowerCase()}`
      : `${n} solicitudes pendientes de aprobar`;

  return (
    <Surface variant="raised" pad="none" className="rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-mutedSoft"><NavIcon name="users" className="h-[18px] w-[18px]" /></span>
        <span className="text-small text-ink">{texto}</span>
        <Link
          href="/admin"
          className="ml-auto text-small text-muted font-medium hover:text-ink transition shrink-0"
        >
          Revisar →
        </Link>
      </div>
    </Surface>
  );
}
