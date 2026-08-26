// ⚠️ TEMPORAL — escaparate de los avisos que salen bajo el saludo de Inicio,
// para verlos todos a la vez y ajustarlos. Borrar cuando esté decidido.
// Código real: DecisionReminder.jsx · FichajeReminder.jsx · AprobacionesReminder.jsx ·
// VacacionesReminder.jsx
import DecisionReminder from "@/components/DecisionReminder";
import FichajeReminder from "@/components/FichajeReminder";
import AprobacionesReminder from "@/components/AprobacionesReminder";
import VacacionesReminder from "@/components/VacacionesReminder";

const hoy = new Date();
const iso = (n) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Caso({ label, children }) {
  return (
    <div className="mb-6">
      <p className="text-micro text-mutedSoft mb-1.5">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function AvisosPage() {
  return (
    <div className="pb-20">
      <p className="section-eyebrow mb-1">Temporal</p>
      <h1 className="font-display text-[26px] text-ink mb-1">Avisos de Inicio</h1>
      <p className="text-small text-mutedSoft mb-8">
        Los que salen bajo el saludo. Componentes reales, así que lo que se vea aquí es lo que hay.
      </p>

      <p className="section-eyebrow mb-3">1 · Decisión de tu solicitud (DecisionReminder)</p>
      <Caso label="Aprobada, sin nota">
        <DecisionReminder decisions={[{ id: "a1", type: "vacaciones", start_date: iso(20), end_date: iso(24), status: "approved" }]} />
      </Caso>
      <Caso label="Aprobada con nota del responsable">
        <DecisionReminder decisions={[{ id: "a2", type: "vacaciones", start_date: iso(20), end_date: iso(20), status: "approved", decision_note: "Perfecto, disfruta." }]} />
      </Caso>
      <Caso label="Rechazada con nota">
        <DecisionReminder decisions={[{ id: "a3", type: "permiso", start_date: iso(5), end_date: iso(5), status: "rejected", decision_note: "Esa semana hay entrega de TradingLab, ¿puedes moverlo?" }]} />
      </Caso>
      <Caso label="Rechazada, nota larga (se trunca)">
        <DecisionReminder decisions={[{ id: "a4", type: "baja", start_date: iso(2), end_date: iso(9), status: "rejected", decision_note: "Necesitamos cobertura porque coincide con el lanzamiento y además hay dos personas más fuera esos mismos días." }]} />
      </Caso>
      <Caso label="Varias a la vez (se apilan)">
        <DecisionReminder decisions={[
          { id: "b1", type: "vacaciones", start_date: iso(30), end_date: iso(34), status: "approved" },
          { id: "b2", type: "permiso", start_date: iso(12), end_date: iso(12), status: "rejected", decision_note: "Justo ese día tenemos la reunión trimestral." },
        ]} />
      </Caso>

      <p className="section-eyebrow mb-3 mt-10">2 · Sin fichar (FichajeReminder)</p>
      <Caso label="Nunca ha fichado"><FichajeReminder days={null} /></Caso>
      <Caso label="8 días"><FichajeReminder days={8} /></Caso>
      <Caso label="45 días"><FichajeReminder days={45} /></Caso>
      <Caso label="7 días o menos → no se muestra (debajo no debe salir nada)"><FichajeReminder days={3} /></Caso>

      <p className="section-eyebrow mb-3 mt-10">3 · Pendientes de aprobar (AprobacionesReminder)</p>
      <Caso label="Una sola">
        <AprobacionesReminder requests={[{ id: "r1", name: "Alba", type: "vacaciones", start: iso(10), end: iso(14), days: 5 }]} />
      </Caso>
      <Caso label="Una sola, tipo permiso">
        <AprobacionesReminder requests={[{ id: "r2", name: "Carles", type: "permiso", start: iso(3), end: iso(3), days: 1 }]} />
      </Caso>
      <Caso label="Varias">
        <AprobacionesReminder requests={[
          { id: "r3", name: "Alba", type: "vacaciones", start: iso(10), end: iso(14), days: 5 },
          { id: "r4", name: "Carla", type: "permiso", start: iso(3), end: iso(3), days: 1 },
          { id: "r5", name: "Mariola", type: "baja", start: iso(1), end: iso(4), days: 4 },
        ]} />
      </Caso>

      <p className="section-eyebrow mb-3 mt-10">4 · Ritmo de vacaciones (VacacionesReminder)</p>
      <Caso label="Al día — no sale nada (retraso de 1 día)">
        <VacacionesReminder pace={{ allowance: 22, planned: 13, remaining: 9, behind: 1, lastCall: false }} />
      </Caso>
      <Caso label="Retraso de 4 días (agosto, 8 planificados de 22)">
        <VacacionesReminder pace={{ allowance: 22, planned: 8, remaining: 14, behind: 4, lastCall: false }} />
      </Caso>
      <Caso label="Retraso grande (2 planificados de 22)">
        <VacacionesReminder pace={{ allowance: 22, planned: 2, remaining: 20, behind: 10, lastCall: false }} />
      </Caso>
      <Caso label="Diciembre, última llamada">
        <VacacionesReminder pace={{ allowance: 22, planned: 16, remaining: 6, behind: 6, lastCall: true }} />
      </Caso>
      <Caso label="Todo planificado — no sale nada">
        <VacacionesReminder pace={{ allowance: 22, planned: 22, remaining: 0, behind: 0, lastCall: true }} />
      </Caso>

      <p className="section-eyebrow mb-3 mt-10">5 · Todos juntos (como se apilan en Inicio)</p>
      <div className="mt-8 empty:mt-0 space-y-3">
        <DecisionReminder decisions={[{ id: "c1", type: "vacaciones", start_date: iso(20), end_date: iso(24), status: "approved" }]} />
        <FichajeReminder days={12} />
        <VacacionesReminder pace={{ allowance: 22, planned: 8, remaining: 14, behind: 4, lastCall: false }} />
        <AprobacionesReminder requests={[{ id: "c2", name: "Alba", type: "vacaciones", start: iso(10), end: iso(14), days: 5 }]} />
      </div>
    </div>
  );
}
