import { notFound } from "next/navigation";
import TimelineClient from "@/components/tasks/TimelineClient";
import { getTimelinePublico } from "@/lib/data/publico";
import { readShare } from "@/lib/share";
import { phaseOf } from "@/lib/projects";
import { madridDateISO } from "@/lib/dates";
import FctsMark from "@/components/FctsMark";

export const metadata = { robots: { index: false, follow: false } };

// Calendario de proyectos abierto por enlace: se ve sin cuenta. Enseña lo justo
// —proyecto, cliente, fechas y en qué punto está— y deja fuera tareas, personas
// y todo lo del equipo. El enlace va firmado y caduca (ver src/lib/share.js).
export default async function TimelinePublicoPage({ params }) {
  const { token } = await params;
  const share = readShare(token);
  if (!share || share.vista !== "timeline-adhoc") notFound();

  const ahora = new Date(`${madridDateISO()}T00:00:00`).getTime();
  const lists = await getTimelinePublico();
  const fila = (l) => ({
    id: l.list_id,
    name: l.list_name,
    status: [l.folder_name, phaseOf(l)?.estado].filter(Boolean).join(" · "),
    phase: phaseOf(l),
    esDelEstudio: true,
    client: l.folder_name ?? null,
    startDate: new Date(l.list_start).getTime(),
    dueDate: new Date(l.list_due).getTime(),
    assignees: [],
  });
  const conFecha = (l) => {
    const i = l.list_start ? new Date(l.list_start).getTime() : 0;
    const f = l.list_due ? new Date(l.list_due).getTime() : 0;
    return i > 0 && f >= i;
  };
  const proyectos = lists.filter(conFecha).map(fila).sort((a, b) => a.startDate - b.startDate);
  const sinFecha = lists
    .filter((l) => !conFecha(l))
    .map((l) => ({ id: l.list_id, name: l.list_name, client: l.folder_name ?? null, phase: phaseOf(l), esDelEstudio: true }))
    .sort((a, b) => (a.phase?.orden ?? 9) - (b.phase?.orden ?? 9));

  const start = proyectos.length ? Math.min(...proyectos.map((p) => p.startDate)) : null;
  const due = proyectos.length ? Math.max(...proyectos.map((p) => p.dueDate)) : null;

  return (
    <div className="min-h-dvh bg-bg">
      <TimelineClient
        proyectos={proyectos}
        sinFecha={sinFecha}
        publico
        now={ahora}
        sprint={{ id: "timeline", name: "Proyectos", client: null, start, due }}
        back={<FctsMark className="h-4 w-auto text-brand shrink-0" />}
      />
    </div>
  );
}
