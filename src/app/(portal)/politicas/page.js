import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { POLICY_ICONS } from "@/components/PolicyIcons";
import { POLICIES } from "@/lib/content";

export default function PoliticasPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Cómo trabajamos"
        title="Políticas"
        helper="Horarios, vacaciones, comunicación, organización y seguridad del estudio."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {POLICIES.map((p) => (
          <Link
            key={p.id}
            href={`/politicas/${p.id}`}
            className="group rounded-2xl bg-surface/55 hover:bg-surface p-7 md:p-8 min-h-[300px] flex flex-col transition"
          >
            <div className="w-10 h-10 text-borderStrong group-hover:text-mutedSoft transition-colors">
              {POLICY_ICONS[p.id]}
            </div>

            <div className="mt-auto pt-10">
              <h2 className="font-display text-[25px] md:text-[27px] leading-[1.15] tracking-[-0.01em] text-ink group-hover:text-brand transition-colors">
                {p.title}
              </h2>
              <p className="text-body text-muted leading-relaxed mt-3 max-w-[34ch]">{p.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
