import Link from "next/link";
import { Surface } from "@/components/ui";
import TareasHoyList from "./TareasHoyList";

/**
 * Feed personal de tareas (de ClickUp) para la persona logueada. Muestra TODAS
 * sus tareas de la semana. Completar cierra en ClickUp.
 * tasks: shape normalizado de src/lib/data/clickup.js (ya ordenado)
 */
export default function TareasHoy({ tasks = [], isAdmin = false, className = "mb-4" }) {
  return (
    <Surface className={className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="section-eyebrow">Tus tareas de la semana</p>
        <Link href="/tareas?scope=mine" className="text-micro text-mutedSoft hover:text-ink transition shrink-0">
          Ver todas →
        </Link>
      </div>

      <TareasHoyList tasks={tasks} isAdmin={isAdmin} />
    </Surface>
  );
}
