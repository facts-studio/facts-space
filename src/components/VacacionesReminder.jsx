import Link from "next/link";
import { Surface } from "@/components/ui";
import NavIcon from "@/components/NavIcon";

// Aviso en Inicio cuando no vas al día con las vacaciones: o llevas retraso
// respecto al ritmo del año, o es diciembre y aún te quedan días sin planificar
// (a 31 se pierden). Ver getVacationPace en @/lib/data/me.
export default function VacacionesReminder({ pace }) {
  if (!pace) return null;
  const { remaining, behind, lastCall } = pace;
  if (remaining <= 0) return null;

  // Fuera de diciembre solo avisamos con un retraso que ya cuesta recuperar.
  const urgent = lastCall;
  if (!urgent && behind < 3) return null;

  const texto = urgent
    ? `Te quedan ${remaining} días de vacaciones y el año acaba este mes`
    : `Vas ${behind} días por detrás del ritmo de vacaciones`;

  return (
    <Surface variant="raised" pad="none" className="rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-mutedSoft"><NavIcon name="calendar" className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0">
          <p className="text-small text-ink truncate">{texto}</p>
          <p className="text-micro text-mutedSoft truncate">
            {urgent
              ? "Los días no gastados no pasan al año que viene."
              : "Octubre y noviembre están cerrados: planifícalos con tiempo."}
          </p>
        </div>
        <Link
          href="/calendario"
          className="ml-auto shrink-0 text-small text-muted font-medium hover:text-ink transition"
        >
          Planificar →
        </Link>
      </div>
    </Surface>
  );
}
