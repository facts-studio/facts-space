import { ScreenHeader } from "@/components/ui";

// Pantalla para una sección que existe pero no es de quien la pide. No es un
// error: se explica por qué y adónde ir, que es lo que necesita un colaborador
// que llega a una URL por un enlace antiguo o compartido.
export default function SinAcceso({ kicker, title, children }) {
  return (
    <div>
      <ScreenHeader kicker={kicker} title={title} />
      <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted max-w-[68ch]">{children}</div>
    </div>
  );
}
