import Link from "next/link";
import { Surface, SectionHeader } from "@/components/ui";
import TareasHoyList from "./TareasHoyList";

/**
 * Feed personal de tareas (de ClickUp) para la persona logueada. Muestra TODAS
 * sus tareas de la semana. Completar cierra en ClickUp.
 * tasks: shape normalizado de src/lib/data/clickup.js (ya ordenado)
 */
export default function TareasHoy({ tasks = [], isAdmin = false, className = "mb-4" }) {
  return (
    // Cabecera FUERA de la caja (mismo patrón que "Sprints activos").
    <section className={className}>
      <SectionHeader
        label="Tus tareas de la semana"
        action={
          <Link href="/tareas?scope=mine" className="text-micro text-mutedSoft hover:text-ink transition shrink-0">
            Ver todas →
          </Link>
        }
      />
      <Surface>
        <TareasHoyList tasks={tasks} isAdmin={isAdmin} />
      </Surface>
    </section>
  );
}
