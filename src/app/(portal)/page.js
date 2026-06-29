import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const SHORTCUTS = [
  { href: "/calendario", title: "Calendario", desc: "Hitos, cumpleaños, vacaciones y festivos del equipo.", icon: "▦" },
  { href: "/politicas", title: "Políticas", desc: "Onboarding, vacaciones y cómo trabajamos.", icon: "❡" },
  { href: "/recursos", title: "Recursos", desc: "Programas, brand assets y enlaces compartidos.", icon: "✦" },
];

export default function HomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Bienvenido/a"
        title="El sitio del"
        italic="equipo"
        helper="Todo lo compartido de F*cts Studio, organizado y a mano. Esto es el esqueleto inicial — iremos llenándolo por secciones."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href} className="row-card p-5 group">
            <div className="w-9 h-9 rounded-xl bg-brandSoft text-brand grid place-items-center text-[15px] mb-4">
              {s.icon}
            </div>
            <h2 className="text-title text-ink mb-1.5 group-hover:text-brand transition-colors">
              {s.title}
            </h2>
            <p className="text-small text-muted leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
