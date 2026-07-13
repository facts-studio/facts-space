import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import FichajeReminder from "@/components/FichajeReminder";
import NovedadesPanel from "@/components/NovedadesPanel";
import TareasHoy from "@/components/TareasHoy";
import { NEWS } from "@/lib/mock";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getPendingVacations } from "@/lib/data/admin";
import { getLastWorkedDate } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";
import { getClickUpTasks, weekTasks, workspaceOverview } from "@/lib/data/clickup";

export default async function HomePage() {
  const [events, me, tasks] = await Promise.all([getCalendarEvents(), getCurrentEmployee(), getClickUpTasks()]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  const pendingApprovals = me?.is_admin ? (await getPendingVacations()).length : 0;
  const mine = weekTasks(tasks, me?.email);
  const overview = workspaceOverview(tasks);

  // Días sin fichar (para el aviso en Inicio). null = nunca ha fichado.
  const lastWorked = me ? await getLastWorkedDate(me.id) : null;
  const daysSinceFichaje = lastWorked
    ? Math.round((new Date(madridDateISO() + "T00:00:00") - new Date(lastWorked + "T00:00:00")) / 86400000)
    : null;
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
      <BirthdayConfetti />
      {/* Columna principal */}
      <div className="min-w-0">
        <TodayHero
          nombre={nombre}
          events={events}
          taskCount={mine.length}
          fichajeReminder={me ? <FichajeReminder days={daysSinceFichaje} /> : null}
        />

        <TareasHoy tasks={mine} overview={overview} isAdmin={Boolean(me?.is_admin)} />
      </div>

      {/* Columna derecha — Novedades */}
      <NovedadesPanel news={NEWS} events={events} pendingApprovals={pendingApprovals} />
    </div>
  );
}
