"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Surface, Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { syncClickUpLists, setListsAccess, setFolderCampaign, setFolderIcon, setFolderColor } from "@/lib/actions/clickup";
import { clientIcon } from "@/lib/client-icons";
import { CLIENT_COLORS, paletteColor } from "@/lib/client-palette";

// Orden preferente de disciplinas; el resto se añade al final.
const DISC_ORDER = ["Management", "Copy", "Social Media", "Design", "UX/UI"];

function orderedDisciplines(lists) {
  const set = new Set(lists.map((l) => l.discipline).filter(Boolean));
  const known = DISC_ORDER.filter((d) => set.has(d));
  const extra = [...set].filter((d) => !DISC_ORDER.includes(d)).sort();
  return [...known, ...extra];
}

function groupByProject(lists) {
  const map = new Map();
  for (const l of lists) {
    const key = l.folder_id || "__space__";
    if (!map.has(key)) map.set(key, { key, label: l.folder_name || "General", lists: [] });
    map.get(key).lists.push(l);
  }
  return [...map.values()];
}

// Agrupa por Space (como en ClickUp); dentro, carpetas × disciplinas propias.
function groupBySpace(lists) {
  const map = new Map();
  for (const l of lists) {
    const key = l.space_id || "otros";
    if (!map.has(key)) map.set(key, { key, name: l.space_name || "Otros", lists: [] });
    map.get(key).lists.push(l);
  }
  return [...map.values()].map((s) => ({
    ...s,
    disciplines: orderedDisciplines(s.lists),
    groups: groupByProject(s.lists),
  }));
}

const LockIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);

// Celda de 3 estados. Clic cicla: desactivada → activada → bloqueada → desactivada.
//  · desactivada: contorno tenue.
//  · activada (todos): taupe con ✓.
//  · bloqueada (solo admin): ink con candado.
const CELL_TITLE = { off: "Desactivada — clic para activar", all: "Activada (todos) — clic para bloquear", admin: "Bloqueada (solo admin) — clic para desactivar" };
function Cell({ access, exists, onClick, disabled }) {
  if (!exists) return <span aria-hidden className="block h-6 w-6 mx-auto rounded-full border border-dashed border-border/60" />;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={CELL_TITLE[access]}
      className={cn(
        "block h-6 w-6 mx-auto rounded-full grid place-items-center text-[11px] transition active:scale-90 disabled:opacity-50",
        access === "admin" ? "bg-ink text-bg shadow-sm"
          : access === "all" ? "bg-brandMid text-bg shadow-sm"
          : "bg-surface2/60 text-transparent hover:bg-surface2 hover:text-mutedSoft"
      )}
    >
      {access === "admin" ? <LockIcon /> : "✓"}
    </button>
  );
}

// Checkbox de tres estados: activo / parcial / vacío. Taupe suave, no negro.
function TriCheck({ state, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={state === "on"}
      className={cn(
        "h-[18px] w-[18px] shrink-0 rounded-full grid place-items-center text-[11px] leading-none border transition active:scale-90 disabled:opacity-50",
        state === "on" ? "bg-brandMid text-bg border-brandMid shadow-sm"
          : state === "some" ? "bg-brandMid/20 text-brandMid border-brandMid/30"
          : "bg-transparent border-borderStrong text-transparent hover:border-brandMid"
      )}
    >
      {state === "some" ? "–" : "✓"}
    </button>
  );
}

// Selector de color (swatches de la paleta) + opción automática.
function ColorPicker({ value, onPick }) {
  const [open, setOpen] = useState(false);
  const cur = CLIENT_COLORS.find((c) => c.key === value);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Color del cliente"
        className="h-6 w-6 rounded-md ring-1 ring-border/60 hover:ring-borderStrong transition grid place-items-center"
        style={{ background: cur ? cur.bg : "rgb(var(--ct-surface2) / 0.6)" }}
      >
        {!cur && <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-warn via-info to-violet" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 left-0 flex items-center gap-1.5 p-2 rounded-xl border border-border/60 bg-paper shadow-float">
            {CLIENT_COLORS.map((c) => (
              <button key={c.key} type="button" onClick={() => { onPick(c.key); setOpen(false); }} title={c.key} className={cn("h-5 w-5 rounded-full ring-1 transition", value === c.key ? "ring-ink" : "ring-border/60 hover:ring-borderStrong")} style={{ background: c.bg }} />
            ))}
            <button type="button" onClick={() => { onPick(null); setOpen(false); }} title="Automático" className={cn("h-5 px-2 rounded-full text-[10px] ring-1 transition", !value ? "ring-ink text-ink" : "ring-border/60 text-mutedSoft hover:text-ink")}>Auto</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ClickUpSources({ lists }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [local, setLocal] = useState(() => new Map(lists.map((l) => [l.list_id, l.visible])));
  const [adminLocal, setAdminLocal] = useState(() => new Map(lists.map((l) => [l.list_id, l.admin_only])));
  const [camp, setCamp] = useState(() => new Map(lists.map((l) => [l.list_id, l.is_campaign])));
  const [iconMap, setIconMap] = useState(() => new Map(lists.map((l) => [l.list_id, l.icon])));
  const [colorMap, setColorMap] = useState(() => new Map(lists.map((l) => [l.list_id, l.color])));

  const spaces = groupBySpace(lists);
  const isOn = (id) => Boolean(local.get(id));
  const accessOf = (id) => (adminLocal.get(id) ? "admin" : local.get(id) ? "all" : "off");
  const activeCount = [...local.values()].filter(Boolean).length;

  // Fija el acceso ("off" | "all" | "admin") de un conjunto de listas.
  const setAccess = (ids, access) => {
    if (!ids.length) return;
    const prevV = new Map(ids.map((id) => [id, local.get(id)]));
    const prevA = new Map(ids.map((id) => [id, adminLocal.get(id)]));
    setLocal((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, access !== "off")); return n; });
    setAdminLocal((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, access === "admin")); return n; });
    setMsg(null);
    start(async () => {
      const res = await setListsAccess(ids, access);
      if (!res?.ok) {
        setMsg(res?.error || "No se pudo guardar (¿falta la migración admin_only?)");
        setLocal((m) => { const n = new Map(m); prevV.forEach((v, id) => n.set(id, v)); return n; });
        setAdminLocal((m) => { const n = new Map(m); prevA.forEach((v, id) => n.set(id, v)); return n; });
      } else {
        router.refresh();
      }
    });
  };
  const cycleCell = (id) => { const cur = accessOf(id); setAccess([id], cur === "off" ? "all" : cur === "all" ? "admin" : "off"); };

  const sync = () => {
    setBusy(true); setMsg(null);
    start(async () => {
      const res = await syncClickUpLists();
      setBusy(false);
      if (!res?.ok) setMsg(res?.error || "Error al sincronizar");
      else { setMsg(`Sincronizadas ${res.count} listas`); router.refresh(); }
    });
  };

  if (!lists.length) {
    return (
      <Surface>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="section-eyebrow">Fuentes ClickUp</p>
          <Button size="sm" onClick={sync} disabled={busy}>{busy ? "Sincronizando…" : "Sincronizar con ClickUp"}</Button>
        </div>
        <EmptyState>Aún no hay listas. Pulsa «Sincronizar» para traer tu estructura de ClickUp y elegir qué se ve en el portal.</EmptyState>
        {msg && <p className="text-micro text-danger mt-3">{msg}</p>}
      </Surface>
    );
  }

  // list_id por (project,discipline)
  const cellId = (group, d) => group.lists.find((l) => l.discipline === d)?.list_id || null;
  const stateOf = (ids) => {
    const on = ids.filter((id) => isOn(id)).length;
    return on === 0 ? "off" : on === ids.length ? "on" : "some";
  };
  const toggleAll = (ids) => setAccess(ids, stateOf(ids) !== "on" ? "all" : "off"); // bloque: activar todo / desactivar todo
  const activeIn = (ids) => ids.filter((id) => isOn(id)).length;

  const uploadedIcon = (ids) => ids.map((id) => iconMap.get(id)).find(Boolean) || null;
  const uploadIcon = (ids, file, label) => {
    if (!file) return;
    if (!/svg/i.test(file.type) && !/\.svg$/i.test(file.name)) { setMsg("Sube un archivo .svg"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = String(reader.result);
      setIconMap((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, dataUri)); return n; });
      setMsg(null);
      start(async () => {
        const res = await setFolderIcon(ids, dataUri);
        if (!res?.ok) setMsg(res?.error || "No se pudo guardar el icono (¿falta la migración icon?)");
        else router.refresh();
      });
    };
    reader.readAsDataURL(file);
  };

  const saveIcon = (ids, val) => {
    setIconMap((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, val)); return n; });
    start(async () => { const res = await setFolderIcon(ids, val); if (!res?.ok) setMsg(res?.error || "No se pudo guardar"); else router.refresh(); });
  };
  const removeIcon = (ids) => saveIcon(ids, "none"); // oculta (→ inicial), aunque haya por defecto
  const restoreIcon = (ids) => saveIcon(ids, null);  // vuelve al icono por defecto

  const colorOf = (ids) => ids.map((id) => colorMap.get(id)).find(Boolean) || null;
  const setColor = (ids, key) => {
    setColorMap((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, key)); return n; });
    start(async () => { const res = await setFolderColor(ids, key); if (!res?.ok) setMsg(res?.error || "No se pudo guardar el color"); else router.refresh(); });
  };

  const isCampaign = (ids) => ids.some((id) => camp.get(id));
  const toggleCampaign = (ids) => {
    const next = !isCampaign(ids);
    setMsg(null);
    setCamp((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, next)); return n; });
    start(async () => {
      const res = await setFolderCampaign(ids, next);
      if (!res?.ok) {
        setMsg(res?.error || "No se pudo guardar (¿falta la migración is_campaign?)");
        setCamp((m) => { const n = new Map(m); ids.forEach((id) => n.set(id, !next)); return n; });
      } else router.refresh();
    });
  };

  return (
    <Surface>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <p className="section-eyebrow">Fuentes ClickUp</p>
        <div className="flex items-center gap-3">
          <span className="text-micro text-mutedSoft">{activeCount} listas activas</span>
          <Button size="sm" variant="ghost" onClick={sync} disabled={busy}>{busy ? "Sincronizando…" : "Sincronizar"}</Button>
        </div>
      </div>
      <div className="mb-6 max-w-[600px] space-y-2">
        <p className="text-micro text-mutedSoft leading-snug">
          Marca qué listas alimentan el portal, agrupadas por espacio de ClickUp. Cada celda cicla en 3 estados; las casillas de fila/columna activan o desactivan en bloque.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-micro text-mutedSoft">
          <span className="inline-flex items-center gap-1.5"><span className="h-4 w-4 rounded-full border border-dashed border-border/60" /> Desactivada</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-brandMid text-bg grid place-items-center text-[9px]">✓</span> Activada (todos)</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-ink text-bg grid place-items-center"><LockIcon size={9} /></span> Bloqueada (solo admin)</span>
        </div>
      </div>

      <div className="space-y-4">
        {spaces.map((space) => {
          const spaceIds = space.lists.map((l) => l.list_id);
          const colIds = (d) => space.lists.filter((l) => l.discipline === d).map((l) => l.list_id);
          const colCls = "px-3 border-l border-border/40 first:border-l-0";
          return (
            <Surface key={space.key} variant="muted" pad="none" className="p-5">
              {/* Cabecera del space */}
              <div className="flex items-center gap-2.5 mb-4">
                <TriCheck state={stateOf(spaceIds)} onClick={() => toggleAll(spaceIds)} title={`Activar / desactivar todo ${space.name}`} />
                <h3 className="text-small font-medium text-ink">{space.name}</h3>
                <span className="text-micro text-mutedSoft tabular-nums">{activeIn(spaceIds)}/{spaceIds.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="border-separate border-spacing-0 min-w-[520px] w-full">
                  <thead>
                    <tr>
                      <th className="text-left align-bottom pb-3 pr-4">
                        <span className="text-[10px] uppercase tracking-[0.12em] text-mutedSoft">Carpeta</span>
                      </th>
                      {space.disciplines.map((d) => {
                        const st = stateOf(colIds(d));
                        return (
                          <th key={d} className={cn("pb-3 align-bottom", colCls)}>
                            <button
                              type="button"
                              onClick={() => toggleAll(colIds(d))}
                              title={`Activar / desactivar ${d} en ${space.name}`}
                              className="group inline-flex flex-col items-center gap-1.5 w-full"
                            >
                              <span className={cn("text-[10px] uppercase tracking-[0.08em] transition whitespace-nowrap", st === "off" ? "text-mutedSoft group-hover:text-ink" : "text-inkSoft")}>{d}</span>
                              <span className={cn("h-1.5 w-1.5 rounded-full transition", st === "on" ? "bg-brandMid" : st === "some" ? "bg-brandMid/40" : "bg-border")} />
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {space.groups.map((group) => {
                      const rIds = group.lists.map((l) => l.list_id);
                      return (
                        <tr key={group.key} className="group/row hover:bg-surface/40 transition-colors">
                          <td className="pr-4 py-2.5 border-t border-border/40">
                            <div className="flex items-center gap-2.5">
                              <TriCheck state={stateOf(rIds)} onClick={() => toggleAll(rIds)} title={`Activar / desactivar ${group.label}`} />
                              {group.key !== "__space__" && (() => {
                                const uploaded = uploadedIcon(rIds);
                                const ic = clientIcon(group.label, uploaded);
                                const col = paletteColor(group.label, colorOf(rIds));
                                const hidden = uploaded === "none";
                                return (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="group/ic relative">
                                      <label className="cursor-pointer block" title="Subir icono SVG del cliente">
                                        <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(e) => { uploadIcon(rIds, e.target.files?.[0], group.label); e.target.value = ""; }} />
                                        <span className="w-6 h-6 rounded-md grid place-items-center overflow-hidden ring-1 ring-border/60 group-hover/ic:ring-borderStrong transition" style={{ background: col.bg }}>
                                          {ic ? (
                                            <span aria-hidden className="block h-[60%] w-[60%]" style={{ backgroundColor: col.fg, WebkitMaskImage: `url("${ic}")`, maskImage: `url("${ic}")`, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />
                                          ) : (
                                            <span className="text-[13px] leading-none" style={{ color: col.fg }}>＋</span>
                                          )}
                                        </span>
                                      </label>
                                      {ic && (
                                        <button type="button" onClick={() => removeIcon(rIds)} title="Quitar icono (usar inicial)" className="absolute -top-1.5 -right-1.5 h-4 w-4 grid place-items-center rounded-full bg-ink text-bg text-[10px] leading-none shadow-sm opacity-0 group-hover/ic:opacity-100 transition">×</button>
                                      )}
                                      {hidden && (
                                        <button type="button" onClick={() => restoreIcon(rIds)} title="Restaurar icono por defecto" className="absolute -top-1.5 -right-1.5 h-4 w-4 grid place-items-center rounded-full bg-surface2 text-ink text-[10px] leading-none shadow-sm opacity-0 group-hover/ic:opacity-100 transition">↺</button>
                                      )}
                                    </div>
                                    <ColorPicker value={colorOf(rIds)} onPick={(k) => setColor(rIds, k)} />
                                  </div>
                                );
                              })()}
                              <button type="button" onClick={() => toggleAll(rIds)} className="text-small text-inkSoft truncate max-w-[140px] text-left hover:text-ink transition">
                                {group.label}
                              </button>
                              <span className="text-micro text-mutedSoft tabular-nums shrink-0">{activeIn(rIds)}/{rIds.length}</span>
                              {group.key !== "__space__" && (
                                <button
                                  type="button"
                                  onClick={() => toggleCampaign(rIds)}
                                  title={isCampaign(rIds) ? "Temporal (campaña/lanzamiento) — pulsa para marcarla como fijo" : "Cliente fijo — pulsa para marcarla como temporal"}
                                  className={cn(
                                    "shrink-0 inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] border transition",
                                    isCampaign(rIds)
                                      ? "bg-brandMid/15 text-brandMid border-brandMid/30"
                                      : "text-mutedSoft border-border/60 hover:text-ink hover:border-borderStrong"
                                  )}
                                >
                                  {isCampaign(rIds) ? <>✦ Temporal</> : "Fijo"}
                                </button>
                              )}
                            </div>
                          </td>
                          {space.disciplines.map((d) => {
                            const id = cellId(group, d);
                            return (
                              <td key={d} className={cn("py-2.5 border-t border-border/40 text-center", colCls)}>
                                <Cell exists={Boolean(id)} access={id ? accessOf(id) : "off"} onClick={() => id && cycleCell(id)} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Surface>
          );
        })}
      </div>

      {msg && <p className={cn("text-micro mt-4", msg.startsWith("Sincronizadas") ? "text-success" : "text-danger")}>{msg}</p>}
    </Surface>
  );
}
