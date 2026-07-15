"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Surface, EmptyState } from "@/components/ui";
import { TaskRow } from "@/components/tasks/task-atoms";
import { setClickUpTaskStatus } from "@/lib/actions/clickup";

// Duración del sprint a partir de las fechas de su lista: "8 sep – 22 sep".
const dm = (ts) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
function sprintRange(m) {
  if (!m) return null;
  if (m.start && m.due) return `${dm(m.start)} – ${dm(m.due)}`;
  if (m.due) return `hasta el ${dm(m.due)}`;
  if (m.start) return `desde el ${dm(m.start)}`;
  return null;
}

// Flecha del navegador de clientes.
function Arrow({ dir, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Cliente anterior" : "Cliente siguiente"}
      className="h-7 w-7 grid place-items-center rounded-lg text-mutedSoft hover:text-ink hover:bg-surface2/60 transition disabled:opacity-25 disabled:pointer-events-none"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

/**
 * Modo "Status" de Inicio: tareas del equipo. Se muestra UN cliente a la vez y
 * se navega entre ellos con flechas. Los proyectos temporales (campañas) van
 * primero entre los que tienen actividad. Dentro de cada cliente, en orden
 * cronológico y cada uno en su caja: completadas → esta semana → semana siguiente.
 * Las filas usan el mismo formato que el área de Tareas (TaskRow).
 */
export default function TareasEquipoSemana({ tasks = [], campaigns = [], statusesByList = {}, sprintMeta = {}, className = "" }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const meta = (g) => (g.listId ? sprintMeta[g.listId] : null);
  const [overrides, setOverrides] = useState(() => new Map()); // id → estado optimista
  const [, start] = useTransition();

  const eff = (t) => overrides.get(t.id) || { status: t.status, statusType: t.statusType, statusColor: t.statusColor };
  const isOpen = (t) => { const s = eff(t).statusType; return s !== "closed" && s !== "done"; };

  // Cambiar estado desde el punto (igual que en /tareas), con revertir si falla.
  const onPickStatus = (id, s) => {
    const prev = overrides.get(id);
    setOverrides((m) => new Map(m).set(id, { status: s.status, statusType: s.type, statusColor: s.color }));
    start(async () => {
      const res = await setClickUpTaskStatus(id, s.status);
      if (!res?.ok) {
        setOverrides((m) => { const n = new Map(m); if (prev) n.set(id, prev); else n.delete(id); return n; });
      }
    });
  };
  const onOpen = (t) => router.push(`/tareas?task=${t.id}`);

  const groups = useMemo(() => {
    const campaignSet = new Set(campaigns);
    const map = new Map();
    for (const t of tasks) {
      const client = t.project || "Sin cliente";
      // Un sprint es un mini-proyecto DENTRO del cliente: caja propia, pero sin
      // dejar de ser suyo (por eso la clave lleva las dos partes).
      const key = t.sprint ? `${client} · ${t.sprint}` : client;
      if (!map.has(key)) map.set(key, { client, sprint: t.sprint || null, listId: t.listId ?? null, items: [] });
      map.get(key).items.push(t);
    }
    return [...map.entries()]
      .map(([name, g]) => {
        const active = g.items.filter((t) => t.bucket === "activa");
        const next = g.items.filter((t) => t.bucket === "siguiente");
        const done = g.items.filter((t) => t.bucket === "completada");
        return {
          name,
          client: g.client,
          sprint: g.sprint,
          listId: g.listId,
          active,
          next,
          done,
          campaign: campaignSet.has(g.client),
          // 0 = tiene activas · 1 = solo semana siguiente · 2 = solo completadas
          rank: active.length ? 0 : next.length ? 1 : 2,
          first: active[0]?.dueDate ?? next[0]?.dueDate ?? Infinity,
        };
      })
      // Primero los que tienen actividad; dentro de cada nivel, lo temporal
      // (sprint o campaña) delante; luego urgencia y nombre.
      .sort((a, b) =>
        (a.rank - b.rank) ||
        ((b.sprint || b.campaign ? 1 : 0) - (a.sprint || a.campaign ? 1 : 0)) ||
        ((a.first === b.first) ? 0 : a.first - b.first) ||
        a.name.localeCompare(b.name)
      );
  }, [tasks, campaigns]);

  if (groups.length === 0) {
    return (
      <div className={className}>
        <p className="section-eyebrow mb-3">Tareas del equipo · esta semana</p>
        <EmptyState>El equipo no tiene tareas para esta semana 🎉</EmptyState>
      </div>
    );
  }

  // Índice seguro por si cambian los datos (refresh) y el actual se sale.
  const i = Math.min(index, groups.length - 1);
  const g = groups[i];

  const blocks = [
    { key: "done", label: "Completadas", items: g.done, muted: true },
    { key: "active", label: "Esta semana", items: g.active },
    { key: "next", label: "Semana siguiente", items: g.next },
  ].filter((b) => b.items.length);

  return (
    <div className={className}>
      {/* Cabecera del módulo: título + navegación entre clientes */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="section-eyebrow">Tareas del equipo · esta semana</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <Arrow dir="prev" onClick={() => setIndex(i - 1)} disabled={i === 0} />
          <span className="text-micro text-mutedSoft tabular-nums px-0.5">{i + 1}/{groups.length}</span>
          <Arrow dir="next" onClick={() => setIndex(i + 1)} disabled={i === groups.length - 1} />
        </div>
      </div>

      {/* Un cliente a la vez; key → re-dispara el fade al cambiar */}
      <div key={g.name} className="fade-up">
        <div className="flex items-center gap-2 mb-2 px-1">
          {/* En un sprint, el cliente sigue por delante: «TradingLab · Sprint Academia» */}
          <p className="text-small text-ink font-medium truncate">
            {g.sprint ? <>{g.client} <span className="text-mutedSoft font-normal">·</span> {g.sprint}</> : g.name}
          </p>
          {(g.sprint || g.campaign) && (
            <span className="shrink-0 text-micro text-mutedSoft border border-border/70 rounded-full px-1.5 leading-[1.5]">
              {g.sprint ? "✦ Sprint" : "Temporal"}
            </span>
          )}
          <span className="text-micro text-mutedSoft/70 tabular-nums shrink-0">{g.active.length}</span>
        </div>

        {/* Duración del sprint. La definición no: aquí interesa el estado de la
            semana, no el briefing (se lee en ClickUp). */}
        {g.sprint && sprintRange(meta(g)) && (
          <p className="px-1 mb-2 -mt-1 text-micro text-mutedSoft">{sprintRange(meta(g))}</p>
        )}

        <div className="flex flex-col gap-2.5">
          {blocks.map((b) => (
            <Surface key={b.key} pad="none" variant={b.muted ? "muted" : "soft"} className="py-3 px-2">
              <p className={`text-micro px-3 mb-1 ${b.muted ? "text-mutedSoft/70" : "text-mutedSoft"}`}>
                {b.label} · {b.items.length}
              </p>
              <div className={b.muted ? "opacity-50 hover:opacity-90 transition-opacity" : ""}>
                {b.items.map((t) => (
                  <TaskRow
                    key={t.id}
                    t={t}
                    eff={eff(t)}
                    open={isOpen(t)}
                    statuses={statusesByList[t.listId] || []}
                    onPickStatus={onPickStatus}
                    onOpen={onOpen}
                    showArea={false}
                    showCaret={false}
                  />
                ))}
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}
