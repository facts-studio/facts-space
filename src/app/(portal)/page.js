import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import NovedadesPanel from "@/components/NovedadesPanel";
import TareasHoy from "@/components/TareasHoy";
import { NEWS } from "@/lib/mock";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getPendingVacations } from "@/lib/data/admin";
import { getClickUpTasks, weekTasks, workspaceOverview } from "@/lib/data/clickup";

export default async function HomePage() {
  const [events, me, tasks] = await Promise.all([getCalendarEvents(), getCurrentEmployee(), getClickUpTasks()]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  const pendingApprovals = me?.is_admin ? (await getPendingVacations()).length : 0;
  const mine = weekTasks(tasks, me?.email);
  const overview = workspaceOverview(tasks);
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
      <BirthdayConfetti />
      {/* Columna principal */}
      <div className="min-w-0">
        <TodayHero nombre={nombre} events={events} />

        <TareasHoy tasks={mine} overview={overview} />
      </div>

      {/* Columna derecha — Novedades */}
      <NovedadesPanel news={NEWS} events={events} pendingApprovals={pendingApprovals} />
    </div>
  );
}
