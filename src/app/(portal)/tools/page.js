import { ScreenHeader, Badge, EmptyState } from "@/components/ui";

export default function ToolsPage() {
  return (
    <div>
      <ScreenHeader kicker="Recursos" title="F*cts Tools" actions={<Badge kind="neutral">Próximamente</Badge>} />

      <EmptyState>Mini-herramientas internas para el equipo. En desarrollo: pronto irán activándose.</EmptyState>
    </div>
  );
}
