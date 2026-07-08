import Link from "next/link";
import { Surface } from "@/components/ui";
import TareasHoyList from "./TareasHoyList";

const MAX = 6;

/**
 * Feed personal de tareas (de ClickUp) para la persona logueada. Muestra las
 * más urgentes; el resto viven en /tareas. Completar cierra en ClickUp.
 * tasks: shape normalizado de src/lib/data/clickup.js (ya ordenado)
 */
export default function TareasHoy({ tasks = [], overview }) {
  const shown = tasks.slice(0, MAX);
  const rest = tasks.length - shown.length;
  return (
    <Surface className="mb-4">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="section-eyebrow">Tus tareas de la semana</p>
        {overview && (overview.overdue > 0 || overview.dueToday > 0) && (
          <span className="text-micro text-mutedSoft">
            Equipo: <b className="text-ink">{overview.dueToday}</b> hoy
            {overview.overdue > 0 && <> · <b className="text-danger">{overview.overdue}</b> vencidas</>}
          </span>
        )}
      </div>

      <TareasHoyList tasks={shown} />

      {rest > 0 && (
        <Link href="/tareas" className="mt-3 inline-block text-micro text-muted hover:text-ink transition">
          Ver todas ({tasks.length}) →
        </Link>
      )}
    </Surface>
  );
}
