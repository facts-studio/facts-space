import { ScreenHeader } from "@/components/ui";
import AdminClient from "./admin-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import {
  getAllEmployees,
  getPendingVacations,
  getRecentDecided,
  getTimeMonthStats,
  getApprovedVacationDays,
  getCalendarManaged,
  getTimeHoursByEmployee,
} from "@/lib/data/admin";
import { getAllDocuments } from "@/lib/data/documents";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getConfiguredLists } from "@/lib/data/clickup";
import { madridDateISO } from "@/lib/dates";

export default async function AdminPage() {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) {
    return (
      <div>
        <ScreenHeader kicker="Gestión" title="Administrar" />
        <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted">
          No tienes permisos de administración. Pide a un administrador que te dé acceso.
        </div>
      </div>
    );
  }

  const month = madridDateISO().slice(0, 7);
  const year = Number(month.slice(0, 4));
  const [employees, pending, recent, timeStats, vacUsed, calendarEvents, timeHours, events] = await Promise.all([
    getAllEmployees(),
    getPendingVacations(),
    getRecentDecided(),
    getTimeMonthStats(month),
    getApprovedVacationDays(year),
    getCalendarManaged(year),
    getTimeHoursByEmployee(month),
    getCalendarEvents(), // ausencias aprobadas → cobertura del equipo en el veredicto
  ]);
  const documents = await getAllDocuments();
  const clickupLists = await getConfiguredLists();

  return (
    <div>
      <ScreenHeader kicker="Gestión" title="Administrar" />
      <AdminClient
        meId={me.id}
        employees={employees}
        pending={pending}
        recent={recent}
        timeStats={timeStats}
        vacUsed={vacUsed}
        calendarEvents={calendarEvents}
        events={events}
        timeHours={timeHours}
        documents={documents}
        clickupLists={clickupLists}
        month={month}
        year={year}
      />
    </div>
  );
}
