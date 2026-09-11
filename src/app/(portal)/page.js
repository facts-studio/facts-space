import BirthdayConfetti from "@/components/BirthdayConfetti";
import TodayHero from "@/components/TodayHero";
import FichajeReminder from "@/components/FichajeReminder";
import AprobacionesReminder from "@/components/AprobacionesReminder";
import ConflictoVacacionesReminder from "@/components/ConflictoVacacionesReminder";
import DecisionReminder from "@/components/DecisionReminder";
import VacacionesReminder from "@/components/VacacionesReminder";
import { taskVacationConflicts } from "@/lib/conflicts";
import HomePanels from "@/components/HomePanels";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getPendingApprovals } from "@/lib/data/admin";
import { getMyDecisions, getVacationPace } from "@/lib/data/me";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getMyNotes } from "@/lib/data/notes";
import { getEmployees } from "@/lib/data/employees";
import { getSlackTickets } from "@/lib/data/slack";
import { getLastWorkedDate } from "@/lib/data/time";
import { isColaborador } from "@/lib/team";
import { madridDateISO } from "@/lib/dates";
import { getClickUpTasks, getVisibleLists, weekTasks, teamWeekTasks, activeSprints, mentionAliases, COLAB_BRANCH } from "@/lib/data/clickup";

export default async function HomePage() {
  const [events, me, tasks, notes, lists, approvals, decisions, tickets, team] = await Promise.all([
    getCalendarEvents(),
    getCurrentEmployee(),
    getClickUpTasks(),
    getMyNotes(),
    getVisibleLists(),
    getPendingApprovals(), // solicitudes que me toca resolver (responsable/admin)
    getMyDecisions(),      // mis solicitudes ya resueltas que aún no he visto
    getSlackTickets(),     // tickets de los canales compartidos (Slack Lists)
    getEmployees(),        // para resolver a quién menciona cada sprint
  ]);
  const nombre = me?.name?.split(" ")[0] || "equipo";
  // Un colaborador entra solo por sus proyectos: nada de cumpleaños, vacaciones
  // ni agenda del equipo. Su Inicio es sus tareas y los sprints donde está.
  const colaborador = isColaborador(me);
  const eventosVisibles = colaborador ? events.filter((e) => e.type === "hito") : events;
  // Cumpleaños de HOY (Madrid) desde el calendario ya filtrado: solo perfiles de
  // ClickUp vinculados a un empleado activo → alimenta el confeti de Inicio.
  const todayISO = madridDateISO();
  const birthdayPeople = colaborador
    ? []
    : events.filter((e) => e.type === "cumple" && e.start === todayISO && e.who).map((e) => e.who);
  // Aviso admin: tareas asignadas a alguien en un día que tiene ausencia aprobada.
  const conflicts = me?.is_admin ? taskVacationConflicts(events, tasks) : [];
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
  // A cada uno se le cuelga QUIÉN lo trabaja: la rama Unfiltrade es del equipo;
  // en F*cts Studio, los colaboradores mencionados en su descripción.
  const porAlias = new Map();
  for (const e of team) for (const alias of mentionAliases(e)) if (!porAlias.has(alias)) porAlias.set(alias, e);
  const sprints = activeSprints(lists, tasks).map((s) => ({
    ...s,
    equipo: s.branch === COLAB_BRANCH ? false : true,
    gente: s.branch === COLAB_BRANCH
      ? [...new Set(s.mentions.map((m) => porAlias.get(m)).filter(Boolean))]
          .map((e) => ({ id: e.id, name: e.name, photo: e.photo || null, color: e.color }))
      : [],
  }));
  // Estados por lista: alimentan el menú del punto de estado en las filas.
  const statusesByList = Object.fromEntries(lists.filter((l) => (l.statuses || []).length).map((l) => [l.list_id, l.statuses]));

  // Días sin fichar (para el aviso en Inicio). null = nunca ha fichado.
  const lastWorked = me ? await getLastWorkedDate(me.id) : null;
  // Ritmo de vacaciones (aviso recurrente si no vas al día). Un colaborador no
  // las lleva con nosotros, así que no se le avisa de nada.
  const vacationPace = me && !colaborador ? await getVacationPace(me) : null;
  const daysSinceFichaje = lastWorked
    ? Math.round((new Date(madridDateISO() + "T00:00:00") - new Date(lastWorked + "T00:00:00")) / 86400000)
    : null;
  return (
    // pb-[40vh]: aire al final para que el contenido no quede pegado abajo (y
    // haya algo de scroll aunque la columna sea corta).
    <div className="grid gap-8 lg:gap-12 items-start pb-[40vh]">
      <BirthdayConfetti people={birthdayPeople} />
      {/* Columna principal */}
      <div className="min-w-0">
        <TodayHero
          nombre={nombre}
          meName={me?.name || ""}
          events={eventosVisibles}
          taskCount={mine.length}
          overdueCount={overdueCount}
          avisos={
            // empty:mt-0 → sin avisos, el contenedor no deja hueco.
            <div className="mt-8 empty:mt-0 space-y-3">
              <DecisionReminder decisions={decisions} />
              {me && <FichajeReminder days={daysSinceFichaje} />}
              <VacacionesReminder pace={vacationPace} />
              <AprobacionesReminder requests={approvals} />
              <ConflictoVacacionesReminder conflicts={conflicts} />
            </div>
          }
        />

        <HomePanels
          events={eventosVisibles}
          tasks={mine}
          teamTasks={teamWeek}
          campaigns={campaigns}
          statusesByList={statusesByList}
          sprintMeta={sprintMeta}
          sprints={sprints}
          tickets={tickets}
          meSlackId={me?.slack_user_id ?? null}
          isAdmin={Boolean(me?.is_admin)}
          isColaborador={colaborador}
          initialNotes={notes}
          canUseNotes={Boolean(me)}
        />
      </div>
    </div>
  );
}
