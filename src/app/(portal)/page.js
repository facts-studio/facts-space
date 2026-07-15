import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import FichajeReminder from "@/components/FichajeReminder";
import HomePanels from "@/components/HomePanels";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getMyNotes } from "@/lib/data/notes";
import { getLastWorkedDate } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";
import { getClickUpTasks, getConfiguredLists, weekTasks, teamWeekTasks, workspaceOverview } from "@/lib/data/clickup";

export default async function HomePage() {
  const [events, me, tasks, notes, lists] = await Promise.all([
    getCalendarEvents(),
    getCurrentEmployee(),
    getClickUpTasks(),
    getMyNotes(),
    getConfiguredLists(),
  ]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  const mine = weekTasks(tasks, me?.email);
  const teamWeek = teamWeekTasks(tasks); // modo Status: todo el equipo, por cliente
  // Proyectos temporales (campañas): van primero en el modo Status.
  const campaigns = [...new Set(lists.filter((l) => l.is_campaign && l.folder_name).map((l) => l.folder_name))];
  // Estados por lista: alimentan el menú del punto de estado en las filas.
  const statusesByList = Object.fromEntries(lists.filter((l) => (l.statuses || []).length).map((l) => [l.list_id, l.statuses]));
  const overview = workspaceOverview(tasks);

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
          fichajeReminder={me ? <FichajeReminder days={daysSinceFichaje} /> : null}
        />

        <HomePanels
          events={events}
          tasks={mine}
          teamTasks={teamWeek}
          campaigns={campaigns}
          statusesByList={statusesByList}
          overview={overview}
          isAdmin={Boolean(me?.is_admin)}
          initialNotes={notes}
          canUseNotes={Boolean(me)}
        />
      </div>
    </div>
  );
}
