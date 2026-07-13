import Link from "next/link";
import { Surface } from "@/components/ui";

// Aviso cuando el empleado lleva más de 7 días sin fichar. `days` es el número
// de días desde el último fichaje (o null si nunca ha fichado).
export default function FichajeReminder({ days }) {
  if (days !== null && days <= 7) return null;

  const texto =
    days === null
      ? "Aún no has fichado"
      : `Llevas ${days} días sin fichar`;

  return (
    <Surface variant="raised" pad="none" className="mt-8 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[14px] leading-none opacity-70">⏱️</span>
        <span className="text-small text-ink">{texto}</span>
        <Link
          href="/fichaje"
          className="ml-auto text-small text-muted font-medium hover:text-ink transition"
        >
          Fichar →
        </Link>
      </div>
    </Surface>
  );
}
