import Link from "next/link";
import { ScreenHeader } from "@/components/ui";
import TimelineGlobal from "@/components/TimelineGlobal";
import SinAcceso from "@/components/SinAcceso";
import { getVisibleLists } from "@/lib/data/clickup";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { isColaborador } from "@/lib/team";
import { paletteColor } from "@/lib/client-palette";
import { madridDateISO } from "@/lib/dates";

// Vista global de proyectos en el tiempo. Mira las FECHAS de las listas, no las
// tareas: es la foto de qué ocupa cada proyecto y dónde se solapan, incluidos
// los que aún no han arrancado y los ya cerrados.
export default async function TimelinePage() {
  const me = await getCurrentEmployee();
  if (isColaborador(me)) {
    return (
      <SinAcceso kicker="Estudio" title="Timeline">
        La vista global de proyectos es interna. Las fechas de los tuyos las tienes en su tablero.
      </SinAcceso>
    );
  }

  const lists = await getVisibleLists();
  const colorsByClient = Object.fromEntries(
    lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color])
  );

  const projects = lists
    // Sin fechas no hay nada que situar: son las listas fijas de cliente.
    .filter((l) => l.list_start && l.list_due)
    .map((l) => ({
      id: l.list_id,
      name: l.list_name,
      client: l.folder_name ?? null,
      start: new Date(l.list_start).getTime(),
      due: new Date(l.list_due).getTime(),
      color: paletteColor(l.folder_name || l.list_name, colorsByClient[l.folder_name]),
    }))
    // Fechas a cero (epoch) son basura de ClickUp, no un proyecto de 1970.
    .filter((p) => p.start > 0 && p.due > 0 && p.due >= p.start);


  return (
    <div>
      <Link href="/" className="text-small text-muted hover:text-ink transition inline-flex items-center gap-1.5 mb-4">← Inicio</Link>
      <ScreenHeader kicker="Estudio" title="Timeline de proyectos" />
      <TimelineGlobal projects={projects} now={new Date(`${madridDateISO()}T00:00:00`).getTime()} />
    </div>
  );
}
