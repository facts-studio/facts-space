"use client";

import { Surface, Badge } from "@/components/ui";
import { ticketsCerradosDesde } from "@/lib/tickets";

// Tickets que se cerraron desde el lunes pasado, para cerrar el repaso: lo que
// pidieron los canales compartidos y ya está resuelto. Va al final porque es
// mirar atrás, después de haber repasado lo que viene.
export default function TicketsCerrados({ tickets = [], desde, className = "" }) {
  const cerrados = ticketsCerradosDesde(tickets, desde);
  if (!cerrados.length) return null;

  return (
    <div className={className}>
      <p className="section-eyebrow mb-3">
        Tickets resueltos · {cerrados.length}
      </p>
      <Surface variant="muted" pad="sm">
        <ul className="divide-y divide-border/40">
          {cerrados.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              <a
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 text-small text-inkSoft hover:text-ink transition truncate"
              >
                {t.title}
              </a>
              {t.list && <Badge kind="neutral">{t.list}</Badge>}
              {t.assignee && <span className="shrink-0 text-micro text-mutedSoft">{t.assignee}</span>}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
