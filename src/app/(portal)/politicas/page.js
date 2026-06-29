import PageHeader from "@/components/PageHeader";

export default function PoliticasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cómo trabajamos"
        title="Políticas"
        helper="Onboarding, política de vacaciones y guías internas. Migraremos aquí el contenido del Notion actual, editable desde Administrar."
      />
      <div className="surface-card-dashed p-12 grid place-items-center text-center">
        <p className="text-body text-muted">
          Aún no hay políticas publicadas.
        </p>
      </div>
    </>
  );
}
