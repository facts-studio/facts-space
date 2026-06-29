import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { POLICY_ICONS } from "@/components/PolicyIcons";
import { POLICIES } from "@/lib/content";

const SHORT = {
  horarios: "Horarios",
  vacaciones: "Vacaciones",
  comunicacion: "Comunicación",
  organizacion: "Organización",
  seguridad: "Seguridad",
};

export default function PoliticasPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Cómo trabajamos"
        title="Políticas"
        helper="Horarios, vacaciones, comunicación, organización y seguridad del estudio."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {POLICIES.map((p, i) => {
          const num = String(i + 1).padStart(2, "0");
          const tinted = p.id === "vacaciones";
          return (
            <Link
              key={p.id}
              href={`/politicas/${p.id}`}
              className={`group relative rounded-2xl min-h-[230px] p-6 flex flex-col items-center justify-center text-center transition ${
                tinted ? "bg-brandSoft/40 hover:bg-brandSoft/60" : "bg-surface/55 hover:bg-surface"
              }`}
            >
              <span className="absolute top-5 left-5 text-micro text-mutedSoft tabular-nums">{num}</span>
              <div className="w-11 h-11 text-mutedSoft mb-5 group-hover:text-ink transition-colors">
                {POLICY_ICONS[p.id]}
              </div>
              <h2 className="text-title text-ink">{SHORT[p.id] || p.title}</h2>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-mutedSoft text-[15px] group-hover:text-ink group-hover:-translate-y-0.5 transition">↗</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
