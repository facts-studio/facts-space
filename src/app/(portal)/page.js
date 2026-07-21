import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import FichajeReminder from "@/components/FichajeReminder";
import AprobacionesReminder from "@/components/AprobacionesReminder";
import DecisionReminder from "@/components/DecisionReminder";
import HomePanels from "@/components/HomePanels";
import SprintsActivos from "@/components/SprintsActivos";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getPendingApprovals } from "@/lib/data/admin";
import { getMyDecisions } from "@/lib/data/me";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getMyNotes } from "@/lib/data/notes";
import { getLastWorkedDate } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";
import { getClickUpTasks, getConfiguredLists, weekTasks, teamWeekTasks, activeSprints } from "@/lib/data/clickup";

export default async function HomePage() {
  const [events, me, tasks, notes, lists, approvals, decisions] = await Promise.all([
    getCalendarEvents(),
    getCurrentEmployee(),
    getClickUpTasks(),
    getMyNotes(),
    getConfiguredLists(),
    getPendingApprovals(), // solicitudes que me toca resolver (responsable/admin)
    getMyDecisions(),      // mis solicitudes ya resueltas que aún no he visto
  ]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  const mine = weekTasks(tasks, me?.email);
  const teamWeek = teamWeekTasks(tasks); // modo Status: todo el equipo, por cliente
  // Vencidas: ya vienen dentro de `mine` (weekTasks no tiene límite inferior),
  // pero el saludo debe nombrarlas aparte.
  const startToday = new Date().setHours(0, 0, 0, 0);
  const overdueCount = mine.filter((t) => t.dueDate && t.dueDate < startToday).length;
  // Proyectos temporales (campañas): van primero en el modo Status.
  const campaigns = [...new Set(lists.filter((l) => l.is_campaign && l.folder_name).map((l) => l.folder_name))];
  // Definición y fechas de cada sprint (campos de la lista en ClickUp).
  const sprintMeta = Object.fromEntries(
    lists.filter((l) => l.is_sprint).map((l) => [l.list_id, { note: (l.list_content || "").trim(), start: l.list_start, due: l.list_due }])
  );
  // Sprints y proyectos temporales en curso (fechas + progreso) para Inicio.
  const sprints = activeSprints(lists, tasks);
  // Estados por lista: alimentan el menú del punto de estado en las filas.
  const statusesByList = Object.fromEntries(lists.filter((l) => (l.statuses || []).length).map((l) => [l.list_id, l.statuses]));

  // Días sin fichar (para el aviso en Inicio). null = nunca ha fichado.
  const lastWorked = me ? await getLastWorkedDate(me.id) : null;
  const daysSinceFichaje = lastWorked
    ? Math.round((new Date(madridDateISO() + "T00:00:00") - new Date(lastWorked + "T00:00:00")) / 86400000)
    : null;
  return (
    // pb-[40vh]: aire al final para que el contenido no quede pegado abajo (y
    // haya algo de scroll aunque la columna sea corta).
    <div className="grid gap-8 lg:gap-12 items-start max-w-4xl mx-auto pb-[40vh]">
      <BirthdayConfetti />
      {/* Columna principal */}
      <div className="min-w-0">
        <TodayHero
          nombre={nombre}
          events={events}
          taskCount={mine.length}
          overdueCount={overdueCount}
          avisos={
            // empty:mt-0 → sin avisos, el contenedor no deja hueco.
            <div className="mt-8 empty:mt-0 space-y-3">
              <DecisionReminder decisions={decisions} />
              {me && <FichajeReminder days={daysSinceFichaje} />}
              <AprobacionesReminder requests={approvals} />
            </div>
          }
        />

        {/* Sprints / proyectos temporales en curso, con plazo y progreso. */}
        <SprintsActivos sprints={sprints} className="mt-10" />

        <HomePanels
          events={events}
          tasks={mine}
          teamTasks={teamWeek}
          campaigns={campaigns}
          statusesByList={statusesByList}
          sprintMeta={sprintMeta}
          isAdmin={Boolean(me?.is_admin)}
          initialNotes={notes}
          canUseNotes={Boolean(me)}
        />
      </div>
    </div>
  );
}
