import PageHeader from "@/components/PageHeader";

export default function RecursosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Compartido"
        title="Recursos"
        helper="Programas contratados, brand assets, carpetas de Drive y enlaces de Raindrop, organizados por categoría."
      />
      <div className="surface-card-dashed p-12 grid place-items-center text-center">
        <p className="text-body text-muted">Aún no hay recursos.</p>
      </div>
    </>
  );
}
