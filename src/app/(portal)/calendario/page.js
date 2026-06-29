import PageHeader from "@/components/PageHeader";

export default function CalendarioPage() {
  return (
    <>
      <PageHeader
        eyebrow="Equipo"
        title="Calendario"
        helper="Hitos, cumpleaños, vacaciones y festivos. Por ahora vacío: en la siguiente fase se carga a mano desde Administrar y, más adelante, se sincroniza con ClickUp, Holded y Google Calendar."
      />
      <div className="surface-card-dashed p-12 grid place-items-center text-center">
        <p className="text-body text-muted">
          Aún no hay eventos. Esta vista mostrará un calendario mensual y la
          lista de próximos hitos.
        </p>
      </div>
    </>
  );
}
