import Link from "next/link";
import SprintGantt from "@/components/SprintGantt";
import SinAcceso from "@/components/SinAcceso";
import { getVisibleLists } from "@/lib/data/clickup";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { isColaborador } from "@/lib/team";
import { paletteColor } from "@/lib/client-palette";

// Timeline global: todos los proyectos con fechas sobre la misma línea de
// tiempo. Usa el cronograma de sprint tal cual —misma escala, mismos zooms,
// mismo dibujo— pero cada fila es un proyecto en el color de su cliente y
// lleva a su tablero en vez de abrir el selector de estado.
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

  const proyectos = lists
    // Sin fechas no hay nada que situar: son las listas fijas de cliente.
    .filter((l) => l.list_start && l.list_due)
    .map((l) => ({
      id: l.list_id,
      name: l.list_name,
      // El cronograma pinta el nombre dentro de la barra; el cliente va en el
      // tooltip, donde hay sitio.
      status: l.folder_name ?? "",
      client: l.folder_name ?? null,
      colorKey: colorsByClient[l.folder_name] ?? l.color ?? null,
      startDate: new Date(l.list_start).getTime(),
      dueDate: new Date(l.list_due).getTime(),
      assignees: [],
    }))
    // Fechas a cero (epoch) son basura de ClickUp, no un proyecto de 1970.
    .filter((p) => p.startDate > 0 && p.dueDate >= p.startDate)
    .sort((a, b) => a.startDate - b.startDate);

  const start = proyectos.length ? Math.min(...proyectos.map((p) => p.startDate)) : null;
  const due = proyectos.length ? Math.max(...proyectos.map((p) => p.dueDate)) : null;

  return (
    <SprintGantt
      sprint={{ id: "timeline", name: "Timeline de proyectos", client: null, start, due }}
      tasks={proyectos}
      readOnly
      colorOf={(p) => paletteColor(p.client || p.name, p.colorKey)}
      hrefOf={(p) => `/sprint/${p.id}`}
      back={<Link href="/" className="text-small text-muted hover:text-ink transition">← Inicio</Link>}
    />
  );
}
