import PageHeader from "@/components/PageHeader";

// Mini-herramientas internas que diseñaremos para el equipo. De momento, demo.
const TOOLS = [
  { id: "paneles", icon: "📰", name: "Paneles de actualidad", desc: "Actualiza los paneles de novedades de los clientes en un clic." },
  { id: "metricas", icon: "📊", name: "Métricas de landings", desc: "Visitas, conversión y velocidad de cada landing publicada." },
  { id: "propuestas", icon: "📄", name: "Generador de propuestas", desc: "Crea propuestas con la plantilla del estudio en segundos." },
  { id: "proyectos", icon: "✅", name: "Estado de proyectos", desc: "Resumen en vivo de ClickUp: cargas, bloqueos y deadlines." },
  { id: "brand", icon: "✦", name: "Brand check", desc: "Valida que una pieza cumple el sistema de marca." },
  { id: "assets", icon: "⬇️", name: "Exportador de assets", desc: "Exporta en los formatos y tamaños acordados por soporte." },
];

export default function ToolsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Hecho por nosotros"
        title="F*cts Tools"
        helper="Mini-herramientas internas que diseñamos para el equipo. En desarrollo: pronto irán activándose."
        action={<span className="pill bg-surface2 text-muted whitespace-nowrap">Próximamente</span>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {TOOLS.map((t) => (
          <div
            key={t.id}
            className="relative rounded-2xl bg-surface/55 aspect-square p-5 flex flex-col items-center justify-center text-center"
          >
            <span className="absolute top-3.5 right-3.5 text-[9.5px] uppercase tracking-[0.12em] text-mutedSoft">Pronto</span>
            <span className="w-11 h-11 rounded-xl bg-surface2 grid place-items-center text-[20px] mb-3">{t.icon}</span>
            <h2 className="text-body font-medium text-ink leading-tight">{t.name}</h2>
            <p className="text-micro text-muted leading-snug mt-1.5 max-w-[22ch]">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
