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
      <p className="section-eyebrow mb-4">Tus tareas de la semana</p>

      <TareasHoyList tasks={tasks} isAdmin={isAdmin} />
    </Surface>
  );
}
