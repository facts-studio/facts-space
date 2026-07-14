import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import FichajeReminder from "@/components/FichajeReminder";
import HomePanels from "@/components/HomePanels";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getMyNotes } from "@/lib/data/notes";
import { getLastWorkedDate } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";
import { getClickUpTasks, weekTasks, workspaceOverview } from "@/lib/data/clickup";

export default async function HomePage() {
  const [events, me, tasks, notes] = await Promise.all([
    getCalendarEvents(),
    getCurrentEmployee(),
    getClickUpTasks(),
    getMyNotes(),
  ]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  const mine = weekTasks(tasks, me?.email);
  const overview = workspaceOverview(tasks);

  // Días sin fichar (para el aviso en Inicio). null = nunca ha fichado.
  const lastWorked = me ? await getLastWorkedDate(me.id) : null;
  const daysSinceFichaje = lastWorked
    ? Math.round((new Date(madridDateISO() + "T00:00:00") - new Date(lastWorked + "T00:00:00")) / 86400000)
    : null;
  return (
    <div className="grid gap-8 lg:gap-12 items-start max-w-4xl mx-auto">
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
          overview={overview}
          isAdmin={Boolean(me?.is_admin)}
          initialNotes={notes}
          canUseNotes={Boolean(me)}
        />
      </div>
    </div>
  );
}
