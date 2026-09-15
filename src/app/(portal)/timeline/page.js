import Link from "next/link";
import TimelineClient from "@/components/tasks/TimelineClient";
import SinAcceso from "@/components/SinAcceso";
import { getVisibleLists, getListProgress } from "@/lib/data/clickup";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { isColaborador } from "@/lib/team";
import { phaseOf, isFactsSpace, isFactsProject, parseProjectMeta, identitiesOf, normalizeName } from "@/lib/projects";
import { getEmployees } from "@/lib/data/employees";
import { madridDateISO } from "@/lib/dates";

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

  const [lists, team] = await Promise.all([getVisibleLists(), getEmployees()]);
  // Una sola lectura del reloj, y del día de Madrid: en el render sería impuro.
  const ahora = new Date(`${madridDateISO()}T00:00:00`).getTime();

  // Quién lleva un proyecto de Adhōc lo dice su cabecera [colaborador: …], y
  // solo eso: quién tenga tareas dentro no es lo mismo que quién lo lleva. El
  // trabajo con Unfiltrade es del equipo entero, así que ahí no hay caras que
  // poner — va la marca de F*cts.
  const porNombre = new Map();
  for (const e of team) for (const id of identitiesOf(e, e.clickup_group_name)) porNombre.set(id, e);
  const colaboradoresDe = (l) =>
    parseProjectMeta(l.list_content)
      .colaboradores.map((c) => porNombre.get(normalizeName(c)))
      .filter(Boolean)
      .map((e) => ({ email: e.email, name: e.name, initials: (e.name || "?")[0] }));

  // Cuánto lleva hecho cada proyecto, contando TODAS sus tareas: las del día a
  // día no traen las cerradas de hace meses, y un proyecto largo salía a medias.
  const progreso = await getListProgress(lists.map((l) => l.list_id));
  const avance = (l) => {
    const p = progreso[String(l.list_id)];
    return p ? { total: p.total, hechas: p.done } : null;
  };

  // El timeline los enseña TODOS, cada uno con su fase. Fuera quedan solo las
  // listas que no son proyectos: las "General" de cada cliente.
  const fila = (l) => ({
    id: l.list_id,
    name: l.list_name,
    // El tooltip dice cliente y estado; la barra ya enseña el cliente.
    status: [l.folder_name, phaseOf(l)?.estado].filter(Boolean).join(" · "),
    phase: phaseOf(l),
    esDelEstudio: isFactsSpace(l),
    client: l.folder_name ?? null,
    href: `/sprint/${l.list_id}`,
    startDate: new Date(l.list_start).getTime(),
    dueDate: new Date(l.list_due).getTime(),
    assignees: isFactsSpace(l) ? colaboradoresDe(l) : [],
    // Trabajo del equipo: se marca con la casa, no con personas.
    equipo: !isFactsSpace(l),
    // Avance del proyecto, dentro de la propia barra.
    meta: (() => {
      const acc = avance(l);
      return acc?.total ? `${acc.hechas}/${acc.total}` : null;
    })(),
    // Todo el trabajo cerrado: da igual de quién sea el proyecto.
    completado: (() => {
      const acc = avance(l);
      return Boolean(acc && acc.total > 0 && acc.hechas === acc.total);
    })(),
    // Pasado de fecha y CON trabajo vivo dentro. Terminar tarde y terminar a
    // tiempo se distinguen; haber acabado todo y que la fecha quede atrás no
    // es ningún problema.
    fueraDePlazo: (() => {
      const acc = avance(l);
      const fin = new Date(l.list_due).getTime();
      const parado = phaseOf(l)?.key === "parado";
      return Boolean(fin < ahora && !parado && acc && acc.total > acc.hechas);
    })(),
  });

  const candidatas = lists.filter((l) => (isFactsSpace(l) ? isFactsProject(l) : l.list_start || l.list_due));
  // Fechas a cero (epoch) son basura de ClickUp, no un proyecto de 1970.
  const conFecha = (l) => {
    const i = l.list_start ? new Date(l.list_start).getTime() : 0;
    const f = l.list_due ? new Date(l.list_due).getTime() : 0;
    return i > 0 && f >= i;
  };
  const proyectos = candidatas.filter(conFecha).map(fila).sort((a, b) => a.startDate - b.startDate);
  // Los que aún no tienen fechas no se pueden situar en una línea de tiempo,
  // pero existen: se listan aparte para que no desaparezcan del mapa.
  const sinFecha = candidatas
    .filter((l) => !conFecha(l))
    .map((l) => ({
      id: l.list_id,
      name: l.list_name,
      client: l.folder_name ?? null,
      phase: phaseOf(l),
      esDelEstudio: isFactsSpace(l),
      equipo: !isFactsSpace(l),
    }))
    .sort((a, b) => (a.phase?.orden ?? 9) - (b.phase?.orden ?? 9));

  const start = proyectos.length ? Math.min(...proyectos.map((p) => p.startDate)) : null;
  const due = proyectos.length ? Math.max(...proyectos.map((p) => p.dueDate)) : null;

  return (
    <TimelineClient
      proyectos={proyectos}
      sinFecha={sinFecha}
      puedeCompartir={Boolean(me?.is_admin)}
      sprint={{ id: "timeline", name: "Timeline de proyectos", client: null, start, due }}
      back={<Link href="/" className="text-small text-muted hover:text-ink transition">← Inicio</Link>}
    />
  );
}
