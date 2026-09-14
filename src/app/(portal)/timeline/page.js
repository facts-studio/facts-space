import Link from "next/link";
import SprintGantt from "@/components/SprintGantt";
import SinAcceso from "@/components/SinAcceso";
import { getVisibleLists, getClickUpTasks, flattenTasks } from "@/lib/data/clickup";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { isColaborador } from "@/lib/team";

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

  const [lists, tasks] = await Promise.all([getVisibleLists(), getClickUpTasks()]);
  const colorsByClient = Object.fromEntries(
    lists.filter((l) => l.color && l.folder_name).map((l) => [l.folder_name, l.color])
  );

  // Quién trabaja cada proyecto y cuánto lleva: sale de sus propias tareas, no
  // hay que declararlo en ninguna parte.
  const porLista = new Map();
  for (const t of flattenTasks(tasks)) {
    const k = String(t.listId);
    if (!porLista.has(k)) porLista.set(k, { total: 0, hechas: 0, gente: new Map() });
    const acc = porLista.get(k);
    acc.total++;
    if (["done", "closed"].includes(t.statusType)) acc.hechas++;
    for (const a of t.assignees ?? []) if (a.email && !acc.gente.has(a.email)) acc.gente.set(a.email, a);
  }

  const proyectos = lists
    // Sin fechas no hay nada que situar: son las listas fijas de cliente.
    .filter((l) => l.list_start && l.list_due)
    .map((l) => ({
      id: l.list_id,
      name: l.list_name,
      // El cliente sale en su etiqueta dentro de la barra; en `status` va para
      // que el tooltip también lo diga.
      status: l.folder_name ?? "",
      client: l.folder_name ?? null,
      colorKey: colorsByClient[l.folder_name] ?? l.color ?? null,
      href: `/sprint/${l.list_id}`,
      startDate: new Date(l.list_start).getTime(),
      dueDate: new Date(l.list_due).getTime(),
      assignees: [...(porLista.get(String(l.list_id))?.gente.values() ?? [])],
      // Avance del proyecto, dentro de la propia barra.
      meta: (() => {
        const acc = porLista.get(String(l.list_id));
        return acc?.total ? `${acc.hechas}/${acc.total}` : null;
      })(),
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
      colorPorFila
      back={<Link href="/" className="text-small text-muted hover:text-ink transition">← Inicio</Link>}
    />
  );
}
