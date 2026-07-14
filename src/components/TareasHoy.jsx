import { Surface } from "@/components/ui";
import TareasHoyList from "./TareasHoyList";

/**
 * Feed personal de tareas (de ClickUp) para la persona logueada. Muestra TODAS
 * sus tareas de la semana. Completar cierra en ClickUp.
 * tasks: shape normalizado de src/lib/data/clickup.js (ya ordenado)
 */
export default function TareasHoy({ tasks = [], overview, isAdmin = false, className = "mb-4" }) {
  return (
    <Surface className={className}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="section-eyebrow">Tus tareas de la semana</p>
        {overview && (overview.overdue > 0 || overview.dueToday > 0) && (
          <span className="text-micro text-mutedSoft">
            Equipo: <b className="text-ink">{overview.dueToday}</b> hoy
            {overview.overdue > 0 && <> · <b className="text-danger">{overview.overdue}</b> vencidas</>}
          </span>
        )}
      </div>

      <TareasHoyList tasks={tasks} isAdmin={isAdmin} />
    </Surface>
  );
}
