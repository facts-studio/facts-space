import PageHeader from "@/components/PageHeader";

const SECTIONS = [
  { title: "Eventos", desc: "Crear y editar hitos, cumpleaños, vacaciones y festivos." },
  { title: "Políticas", desc: "Redactar y ordenar las políticas del equipo." },
  { title: "Recursos", desc: "Gestionar enlaces, programas y categorías." },
  { title: "Equipo", desc: "Miembros, roles y cumpleaños." },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gestión"
        title="Administrar"
        helper="Desde aquí se edita todo el contenido del portal. Las pantallas de edición llegan en la Fase 1."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="card p-5">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-title text-ink">{s.title}</h2>
              <span className="pill bg-surface2 text-mutedSoft">Próximamente</span>
            </div>
            <p className="text-small text-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
