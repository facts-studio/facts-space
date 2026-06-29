import PageHeader from "@/components/PageHeader";
import { Avatar } from "@/components/EventBadge";
import { TEAM, fmtDate } from "@/lib/mock";

export default function EquipoPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Personas"
        title="Equipo"
        helper="Quién es quién en F*cts Studio."
        action={<span className="pill bg-surface2 text-muted">{TEAM.length} personas</span>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEAM.map((m) => (
          <div key={m.id} className="card p-5 flex items-center gap-4">
            <Avatar name={m.name} color={m.color} photo={m.photo} size={56} />
            <div className="min-w-0">
              <p className="text-title text-ink truncate">{m.name}</p>
              <p className="text-small text-muted truncate">{m.role}</p>
              <p className="text-micro text-mutedSoft truncate mt-1">
                {m.email} · 🎂 {fmtDate(m.birthday)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
