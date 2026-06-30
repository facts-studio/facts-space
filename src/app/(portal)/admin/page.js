import PageHeader from "@/components/PageHeader";
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
import { madridDateISO } from "@/lib/dates";

export default async function AdminPage() {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) {
    return (
      <div>
        <PageHeader eyebrow="Gestión" title="Administrar" helper="Panel de administración." />
        <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted">
          No tienes permisos de administración. Pide a un administrador que te dé acceso.
        </div>
      </div>
    );
  }

  const month = madridDateISO().slice(0, 7);
  const year = Number(month.slice(0, 4));
  const [employees, pending, recent, timeStats, vacUsed, calendarEvents, timeHours] = await Promise.all([
    getAllEmployees(),
    getPendingVacations(),
    getRecentDecided(),
    getTimeMonthStats(month),
    getApprovedVacationDays(year),
    getCalendarManaged(year),
    getTimeHoursByEmployee(month),
  ]);
  const documents = await getAllDocuments();

  return (
    <div>
      <PageHeader eyebrow="Gestión" title="Administrar" helper="Vacaciones, equipo y registro horario del estudio." />
      <AdminClient
        employees={employees}
        pending={pending}
        recent={recent}
        timeStats={timeStats}
        vacUsed={vacUsed}
        calendarEvents={calendarEvents}
        timeHours={timeHours}
        documents={documents}
        month={month}
        year={year}
      />
    </div>
  );
}
