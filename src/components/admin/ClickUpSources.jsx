"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Surface, Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { syncClickUpLists, setListsAccess, setFolderCampaign, setFolderIcon, setFolderColor, setListSprint } from "@/lib/actions/clickup";
import { clientIcon } from "@/lib/client-icons";
import { CLIENT_COLORS, paletteColor } from "@/lib/client-palette";

function groupByProject(lists) {
  const map = new Map();
  for (const l of lists) {
    const key = l.folder_id || "__space__";
    if (!map.has(key)) map.set(key, { key, label: l.folder_name || "General", lists: [] });
    map.get(key).lists.push(l);
  }
  return [...map.values()];
}

// Agrupa por Space (como en ClickUp); dentro, una carpeta por cliente con SUS
// listas. No hay columnas comunes: cada cliente tiene las que tiene.
function groupBySpace(lists) {
  const map = new Map();
  for (const l of lists) {
    const key = l.space_id || "otros";
    if (!map.has(key)) map.set(key, { key, name: l.space_name || "Otros", lists: [] });
    map.get(key).lists.push(l);
  }
  return [...map.values()].map((s) => ({ ...s, groups: groupByProject(s.lists) }));
}

const LockIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);

// Estados de acceso de una lista, con su glifo. Se pintan igual en la píldora y
// en el menú, para que uno explique al otro.
const ACCESS = [
  { key: "all",   label: "Visible para todos" },
  { key: "admin", label: "Solo admin" },
  { key: "off",   label: "Desactivada" },
];
const AccessGlyph = ({ access }) => {
  if (access === "admin") return <LockIcon size={10} />;
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full shrink-0",
        access === "all" ? "bg-brandMid" : "border border-borderStrong"
      )}
    />
  );
};

// Opción del menú de lista.
const MenuRow = ({ glyph, label, on, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-small text-inkSoft hover:bg-surface2/70 hover:text-ink transition text-left"
  >
    <span className="w-3 grid place-items-center shrink-0">{glyph}</span>
    <span className="flex-1 truncate">{label}</span>
    {on && <span className="text-ink text-[11px]">✓</span>}
  </button>
);

// Píldora de lista + menú. Antes ciclaba estados a ciegas con cada clic y el
// sprint era un ✦ que solo asomaba al hacer hover: imposible de adivinar. Ahora
// la píldora MUESTRA su estado y el menú lo dice con palabras.
function ListMenu({ name, access, sprint, onAccess, onToggleSprint }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);

  const toggle = () => {
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ x: r.left, y: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[12px] transition shrink-0",
          open && "ring-2 ring-ink/15",
          access === "off"
            ? "border-border/60 text-mutedSoft hover:text-ink hover:border-borderStrong"
            : "border-border/60 bg-surface2/70 text-ink hover:border-borderStrong"
        )}
      >
        <AccessGlyph access={access} />
        {name}
        {sprint && <span className="text-brandMid text-[10px] leading-none" title="Sprint">✦</span>}
      </button>

      {open && pos && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="fixed z-[91] min-w-[200px] rounded-xl bg-paper border border-border shadow-float p-1" style={{ left: pos.x, top: pos.y }}>
            <p className="px-2.5 pt-1 pb-1.5 text-[10px] uppercase tracking-[0.12em] text-mutedSoft truncate">{name}</p>
            {ACCESS.map((o) => (
              <MenuRow
                key={o.key}
                glyph={<AccessGlyph access={o.key} />}
                label={o.label}
                on={access === o.key}
                onClick={() => { onAccess(o.key); setOpen(false); }}
              />
            ))}
            {onToggleSprint && (
              <>
                <div className="my-1 h-px bg-border/60" />
                <MenuRow
                  glyph={<span className="text-brandMid text-[11px] leading-none">✦</span>}
                  label="Sprint"
                  on={Boolean(sprint)}
                  onClick={() => { onToggleSprint(); setOpen(false); }}
                />
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </>
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
// El desplegable se saca a un PORTAL con posición fija: la tabla de fuentes vive
// en un contenedor con overflow-x-auto y, en CSS, si un eje no es `visible` el
// otro pasa a `auto` → un popover `absolute` se recortaba por abajo.
function ColorPicker({ value, onPick }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { x, y } en viewport
  const btnRef = useRef(null);
  const cur = CLIENT_COLORS.find((c) => c.key === value);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left, y: r.bottom + 6 });
  };
  const toggle = () => { if (!open) place(); setOpen((o) => !o); };

  // Reposiciona/cierra si se hace scroll o cambia el tamaño (posición fija).
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Color del cliente"
        className="h-6 w-6 rounded-md ring-1 ring-border/60 hover:ring-borderStrong transition grid place-items-center"
        style={{ background: cur ? cur.bg : "rgb(var(--ct-surface2) / 0.6)" }}
      >
        {!cur && <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-warn via-info to-violet" />}
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[91] flex items-center gap-1.5 p-2 rounded-xl border border-border/60 bg-paper shadow-float"
            style={{ left: pos.x, top: pos.y }}
          >
            {CLIENT_COLORS.map((c) => (
              <button key={c.key} type="button" onClick={() => { onPick(c.key); setOpen(false); }} title={c.key} className={cn("h-5 w-5 rounded-full ring-1 transition", value === c.key ? "ring-ink" : "ring-border/60 hover:ring-borderStrong")} style={{ background: c.bg }} />
            ))}
            <button type="button" onClick={() => { onPick(null); setOpen(false); }} title="Automático" className={cn("h-5 px-2 rounded-full text-[10px] ring-1 transition", !value ? "ring-ink text-ink" : "ring-border/60 text-mutedSoft hover:text-ink")}>Auto</button>
          </div>
        </>,
        document.body
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
  const [sprint, setSprint] = useState(() => new Map(lists.map((l) => [l.list_id, l.is_sprint])));
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

  // Sprint: por LISTA (no se propaga a la carpeta, a diferencia de campaña).
  const isSprint = (id) => Boolean(sprint.get(id));
  const toggleSprint = (id) => {
    const next = !isSprint(id);
    setMsg(null);
    setSprint((m) => new Map(m).set(id, next));
    start(async () => {
      const res = await setListSprint(id, next);
      if (!res?.ok) {
        setMsg(res?.error || "No se pudo guardar (¿falta la migración is_sprint?)");
        setSprint((m) => new Map(m).set(id, !next));
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
          Marca qué listas alimentan el portal. Cada cliente muestra sus propias listas: pulsa una para elegir quién la ve o marcarla como sprint (mini-proyecto temporal dentro del cliente).
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-micro text-mutedSoft">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brandMid" /> Visible para todos</span>
          <span className="inline-flex items-center gap-1.5"><LockIcon size={10} /> Solo admin</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-borderStrong" /> Desactivada</span>
          <span className="inline-flex items-center gap-1.5"><span className="text-brandMid">✦</span> Sprint</span>
        </div>
      </div>

      <div className="space-y-4">
        {spaces.map((space) => {
          const spaceIds = space.lists.map((l) => l.list_id);
          return (
            <Surface key={space.key} variant="muted" pad="none" className="p-5">
              {/* Cabecera del space */}
              <div className="flex items-center gap-2.5 mb-3">
                <TriCheck state={stateOf(spaceIds)} onClick={() => toggleAll(spaceIds)} title={`Activar / desactivar todo ${space.name}`} />
                <h3 className="text-small font-medium text-ink">{space.name}</h3>
                <span className="text-micro text-mutedSoft tabular-nums">{activeIn(spaceIds)}/{spaceIds.length}</span>
              </div>

              {/* Una fila por carpeta, con SUS listas. Nada de columnas comunes:
                  cada cliente tiene las suyas y no todos comparten las mismas. */}
              <div className="divide-y divide-border/40">
                {space.groups.map((group) => {
                  const rIds = group.lists.map((l) => l.list_id);
                  const isClient = group.key !== "__space__";
                  return (
                    <div key={group.key} className="group/row flex items-start gap-3 py-2.5 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TriCheck state={stateOf(rIds)} onClick={() => toggleAll(rIds)} title={`Activar / desactivar ${group.label}`} />
                        {isClient && (() => {
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
                        <button type="button" onClick={() => toggleAll(rIds)} className="text-small text-inkSoft truncate max-w-[150px] text-left hover:text-ink transition">
                          {group.label}
                        </button>
                        {isClient && (
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

                      {/* Sus listas */}
                      <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                        {group.lists.map((l) => (
                          <ListMenu
                            key={l.list_id}
                            name={l.list_name}
                            access={accessOf(l.list_id)}
                            onAccess={(a) => setAccess([l.list_id], a)}
                            sprint={isSprint(l.list_id)}
                            onToggleSprint={isClient ? () => toggleSprint(l.list_id) : null}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          );
        })}
      </div>

      {msg && <p className={cn("text-micro mt-4", msg.startsWith("Sincronizadas") ? "text-success" : "text-danger")}>{msg}</p>}
    </Surface>
  );
}
