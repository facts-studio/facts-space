import Link from "next/link";
import { notFound } from "next/navigation";
import EmpleadoClient from "./empleado-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import {
  getEmployeeById,
  getEmployeeRequests,
  getEmployeeDocuments,
  getEmployeeTime,
  getApprovedVacationDays,
  getAllEmployees,
} from "@/lib/data/admin";
import { madridDateISO } from "@/lib/dates";

export default async function EmpleadoPage({ params }) {
  const { id } = await params;
  const me = await getCurrentEmployee();
  if (!me?.is_admin) {
    return (
      <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted">
        No tienes permisos de administración.
      </div>
    );
  }

  const today = madridDateISO();
  const month = today.slice(0, 7);
  const year = Number(today.slice(0, 4));

  const [employee, requests, documents, time, vacUsed, employees] = await Promise.all([
    getEmployeeById(id),
    getEmployeeRequests(id),
    getEmployeeDocuments(id),
    getEmployeeTime(id, month),
    getApprovedVacationDays(year),
    getAllEmployees(),
  ]);

  if (!employee) notFound();

  return (
    <div>
      <Link href="/admin" className="text-small text-muted hover:text-ink transition inline-flex items-center gap-1.5 mb-4">← Volver a Administrar</Link>
      <EmpleadoClient
        employee={employee}
        employees={employees}
        requests={requests}
        documents={documents}
        time={time}
        vacUsed={vacUsed[id] || 0}
        month={month}
        year={year}
      />
    </div>
  );
}
