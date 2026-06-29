import PageHeader from "@/components/PageHeader";
import { EventPill, Avatar } from "@/components/EventBadge";
import { EVENTS, EVENT_TYPES, TEAM, fmtRange, fmtDate } from "@/lib/mock";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gestión"
        title="Administrar"
        helper="Edición de todo el contenido del portal. (Demo con datos ficticios.)"
        action={<button className="btn-primary">+ Nuevo</button>}
      />

      {/* Eventos */}
      <section className="card overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-title text-ink">Eventos</h2>
          <span className="count-pill bg-surface2 text-muted">{EVENTS.length}</span>
        </div>
        <table className="table">
          <thead>
            <tr><th>Título</th><th>Tipo</th><th>Fechas</th><th>Persona</th><th></th></tr>
          </thead>
          <tbody>
            {EVENTS.map((e) => (
              <tr key={e.id}>
                <td className="text-ink">{e.title}</td>
                <td><EventPill color={EVENT_TYPES[e.type].color}>{EVENT_TYPES[e.type].label}</EventPill></td>
                <td className="text-muted tabular-nums">{fmtRange(e.start, e.end)}</td>
                <td className="text-muted">{e.who || "—"}</td>
                <td className="text-right"><button className="btn-quiet">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Equipo */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-title text-ink">Equipo</h2>
          <span className="count-pill bg-surface2 text-muted">{TEAM.length}</span>
        </div>
        <table className="table">
          <thead>
            <tr><th>Miembro</th><th>Rol</th><th>Email</th><th>Cumpleaños</th><th></th></tr>
          </thead>
          <tbody>
            {TEAM.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.color} size={28} />
                    <span className="text-ink">{m.name}</span>
                  </div>
                </td>
                <td className="text-muted">{m.role}</td>
                <td className="text-muted">{m.email}</td>
                <td className="text-muted tabular-nums">{fmtDate(m.birthday)}</td>
                <td className="text-right"><button className="btn-quiet">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
