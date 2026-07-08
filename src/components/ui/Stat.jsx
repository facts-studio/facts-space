import Surface from "./Surface";
import { cn } from "@/lib/cn";

/**
 * Tarjeta de métrica: eyebrow + número grande en font-display. Unifica los tres
 * `Stat` inline que había en fichaje / mi-espacio / empleado.
 */
export default function Stat({ label, value, capitalize = false, className }) {
  return (
    <Surface pad="none" className={cn("p-5", className)}>
      <p className={cn("section-eyebrow mb-2", capitalize && "capitalize")}>{label}</p>
      <p className="font-display text-[26px] leading-none text-ink tabular-nums">{value}</p>
    </Surface>
  );
}
