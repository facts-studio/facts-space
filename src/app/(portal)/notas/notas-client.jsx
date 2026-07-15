"use client";

import { useEffect, useRef, useState } from "react";
import { Surface, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { createNote, updateNote } from "@/lib/actions/notes";

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

// ── Modelo ───────────────────────────────────────────────────────────────────
// doc.items = [ sección, … ]  (todas en columna)
//   { id, type:'text',  blocks:[{ id, style:'p'|'h1'|'h2'|'h3'|'ul', text }] }
//   { id, type:'tasks', title, items:[{ id, text, done }] }
const textSection = () => ({ id: uid(), type: "text", blocks: [{ id: uid(), style: "p", text: "" }] });
const tasksSection = () => ({ id: uid(), type: "tasks", title: "", items: [{ id: uid(), text: "", done: false }] });

// Normaliza / migra el formato antiguo (bloques sueltos text/todo) a secciones.
function normalizeSections(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return [];
  const looksOld = arr.some((x) => x && (x.type === "todo" || (x.type === "text" && x.blocks === undefined && x.text !== undefined)));
  if (looksOld) {
    const out = [];
    const textBlocks = arr.filter((x) => x.type !== "todo").map((x) => ({ id: x.id || uid(), style: "p", text: x.text || "" }));
    const tasks = arr.filter((x) => x.type === "todo").map((x) => ({ id: x.id || uid(), text: x.text || "", done: !!x.done }));
    if (textBlocks.length) out.push({ id: uid(), type: "text", blocks: textBlocks });
    if (tasks.length) out.push({ id: uid(), type: "tasks", title: "", items: tasks });
    return out;
  }
  return arr
    .map((s) => {
      if (s?.type === "tasks") {
        return { id: s.id || uid(), type: "tasks", title: s.title || "", items: (s.items || []).map((it) => ({ id: it.id || uid(), text: it.text || "", done: !!it.done })) };
      }
      const blocks = (s?.blocks || []).map((b) => ({ id: b.id || uid(), style: ["p", "h1", "h2", "h3", "ul"].includes(b.style) ? b.style : "p", text: b.text || "" }));
      return { id: s?.id || uid(), type: "text", blocks: blocks.length ? blocks : [{ id: uid(), style: "p", text: "" }] };
    })
    .filter(Boolean);
}

// ── Átomos ───────────────────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, onKeyDown, onFocus, onBlur, placeholder, className, inputRef }) {
  const ref = useRef(null);
  const setRefs = (el) => { ref.current = el; inputRef?.(el); };
  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(grow, [value]);
  // Re-mide al montar y cuando cargan las fuentes: si se mide antes de que la
  // tipografía esté lista, el scrollHeight sale corto y recorta el texto.
  useEffect(() => {
    grow();
    document.fonts?.ready?.then(grow).catch(() => {});
    window.addEventListener("resize", grow);
    return () => window.removeEventListener("resize", grow);
  }, []);
  return (
    <textarea
      ref={setRefs}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={grow}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "block box-border w-full bg-transparent resize-none outline-none overflow-hidden",
        "leading-relaxed py-1 placeholder:text-mutedSoft/60",
        className
      )}
    />
  );
}

function IconButton({ label, onClick, disabled, active = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "h-7 w-7 grid place-items-center rounded-lg transition disabled:opacity-30 disabled:pointer-events-none",
        active ? "text-ink bg-surface2/70" : "text-mutedSoft hover:text-ink hover:bg-surface2/60"
      )}
    >
      {children}
    </button>
  );
}

// Círculo de estado (guiño a la lista de Tareas).
function TaskDot({ done, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={cn(
        "shrink-0 h-[18px] w-[18px] mt-1.5 rounded-full border-[1.6px] grid place-items-center transition",
        done ? "bg-ink border-ink text-bg" : "border-borderStrong text-transparent hover:border-ink"
      )}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </button>
  );
}

// ── Sección de texto (H1/H2/H3, párrafo, lista) ─────────────────────────────
const STYLE_CLS = {
  h1: "text-[24px] font-display font-semibold text-ink",
  h2: "text-[19px] font-semibold text-ink",
  h3: "text-[16px] font-semibold text-ink",
  p: "text-small text-inkSoft",
  ul: "text-small text-inkSoft",
};
const STYLE_PH = { h1: "Título", h2: "Encabezado", h3: "Subtítulo", p: "Escribe algo…", ul: "Elemento" };
const TOOLS = [
  { key: "p", label: "Párrafo", short: "P" },
  { key: "h1", label: "Título 1", short: "H1" },
  { key: "h2", label: "Título 2", short: "H2" },
  { key: "h3", label: "Título 3", short: "H3" },
  { key: "ul", label: "Lista", short: "•" },
];

const GutterBtn = ({ label, onClick, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // no robar el foco al bloque
    onClick={onClick}
    title={label}
    aria-label={label}
    className="h-5 w-5 grid place-items-center rounded text-mutedSoft/70 hover:text-ink hover:bg-surface2/70 transition"
  >
    {children}
  </button>
);

// Menú de formato del bloque (se abre desde el grip del margen, estilo Notion).
function BlockMenu({ onPick, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <GutterBtn label="Formato del bloque" onClick={() => setOpen((o) => !o)}>
        <svg width="11" height="11" viewBox="0 0 10 16" fill="currentColor" aria-hidden>
          <circle cx="2.5" cy="3" r="1.2" /><circle cx="7.5" cy="3" r="1.2" />
          <circle cx="2.5" cy="8" r="1.2" /><circle cx="7.5" cy="8" r="1.2" />
          <circle cx="2.5" cy="13" r="1.2" /><circle cx="7.5" cy="13" r="1.2" />
        </svg>
      </GutterBtn>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[168px] rounded-xl bg-paper border border-border shadow-float p-1">
          {TOOLS.map((t) => (
            <button
              key={t.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(t.key); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-small text-inkSoft hover:bg-surface2/70 hover:text-ink transition text-left"
            >
              <span className="w-5 text-[11px] text-mutedSoft tabular-nums">{t.short}</span>
              {t.label}
            </button>
          ))}
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full px-2.5 py-1.5 rounded-lg text-small text-mutedSoft hover:bg-surface2/70 hover:text-danger transition text-left"
          >
            Eliminar bloque
          </button>
        </div>
      )}
    </div>
  );
}

function TextSection({ section, onChange, first }) {
  const blocks = section.blocks;
  const refs = useRef(new Map());
  const focusNext = useRef(null);
  useEffect(() => {
    const f = focusNext.current;
    if (!f) return;
    focusNext.current = null;
    const el = refs.current.get(f.id);
    if (el) { el.focus(); const p = f.atEnd ? el.value.length : 0; el.setSelectionRange(p, p); }
  });

  const set = (next) => onChange({ ...section, blocks: next });
  const setBlock = (i, patch) => set(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const onText = (i, text) => {
    const b = blocks[i];
    // Atajos markdown al inicio de línea.
    const shortcuts = { "# ": "h1", "## ": "h2", "### ": "h3", "- ": "ul", "* ": "ul" };
    for (const [k, style] of Object.entries(shortcuts)) {
      if (b.style === "p" && text === k) { setBlock(i, { style, text: "" }); return; }
    }
    setBlock(i, { text });
  };
  const addAfter = (i, style = "p") => {
    const nb = { id: uid(), style, text: "" };
    focusNext.current = { id: nb.id, atEnd: false };
    set([...blocks.slice(0, i + 1), nb, ...blocks.slice(i + 1)]);
  };
  const removeAt = (i) => {
    if (blocks.length === 1) { set([{ id: uid(), style: "p", text: "" }]); return; }
    const prev = blocks[i - 1];
    if (prev) focusNext.current = { id: prev.id, atEnd: true };
    set(blocks.filter((_, j) => j !== i));
  };
  const onKey = (e, i) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addAfter(i, blocks[i].style === "ul" ? "ul" : "p"); // listas continúan; encabezados no
    } else if (e.key === "Backspace") {
      const el = e.target;
      if (el.selectionStart === 0 && el.selectionEnd === 0 && blocks[i].text === "") {
        e.preventDefault();
        if (blocks[i].style !== "p") setBlock(i, { style: "p" }); // 1º backspace: a párrafo
        else removeAt(i);
      }
    }
  };

  return (
    // -ml-11: el margen de controles se mete en el padding de la caja, para no
    // desplazar el texto más de la cuenta.
    <div className="flex flex-col gap-0.5 -ml-11">
      {blocks.map((b, i) => (
        // El estilo tipográfico va en la FILA: así el textarea lo hereda y el
        // margen puede medir una línea exacta con em (h-[1.625em] = leading-relaxed),
        // quedando centrado sea párrafo o H1.
        <div key={b.id} className={cn("group/b flex items-start gap-1", STYLE_CLS[b.style])}>
          {/* Margen con controles — aparecen al pasar el ratón por la línea */}
          <div className="w-10 shrink-0 flex items-center justify-end gap-0.5 mt-1 h-[1.625em] opacity-0 group-hover/b:opacity-100 focus-within:opacity-100 transition-opacity">
            <GutterBtn label="Añadir bloque debajo" onClick={() => addAfter(i)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </GutterBtn>
            <BlockMenu onPick={(style) => setBlock(i, { style })} onDelete={() => removeAt(i)} />
          </div>

          {b.style === "ul" && (
            <span className="shrink-0 mt-1 h-[1.625em] flex items-center text-mutedSoft select-none">•</span>
          )}
          <AutoTextarea
            value={b.text}
            onChange={(v) => onText(i, v)}
            onKeyDown={(e) => onKey(e, i)}
            placeholder={first && i === 0 && b.style === "p" ? "Escribe, o usa «# », «- » para dar formato…" : STYLE_PH[b.style]}
            inputRef={(el) => { if (el) refs.current.set(b.id, el); else refs.current.delete(b.id); }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Sección de lista de tareas (versión simple de /tareas) ──────────────────
function TasksSection({ section, onChange }) {
  const items = section.items;
  const refs = useRef(new Map());
  const focusNext = useRef(null);
  useEffect(() => {
    const f = focusNext.current;
    if (!f) return;
    focusNext.current = null;
    const el = refs.current.get(f.id);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });

  const set = (next) => onChange({ ...section, items: next });
  const setItem = (id, patch) => set(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addAfter = (i) => {
    const nb = { id: uid(), text: "", done: false };
    focusNext.current = { id: nb.id };
    set([...items.slice(0, i + 1), nb, ...items.slice(i + 1)]);
  };
  const removeAt = (i) => {
    if (items.length === 1) { set([{ id: uid(), text: "", done: false }]); return; }
    const prev = items[i - 1];
    if (prev) focusNext.current = { id: prev.id };
    set(items.filter((_, j) => j !== i));
  };
  const onKey = (e, i) => {
    if (e.key === "Enter") { e.preventDefault(); addAfter(i); }
    else if (e.key === "Backspace" && e.target.selectionStart === 0 && items[i].text === "") { e.preventDefault(); removeAt(i); }
  };

  const done = items.filter((it) => it.done).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Lista de tareas"
          className="flex-1 min-w-0 bg-transparent outline-none text-ink font-medium text-[15px] placeholder:text-mutedSoft/60 placeholder:font-normal"
        />
        <span className="text-micro text-mutedSoft tabular-nums shrink-0">{done}/{items.length}</span>
      </div>
      <div className="flex flex-col">
        {items.map((it, i) => (
          <div key={it.id} className="group/it flex items-start gap-2.5 py-0.5">
            <TaskDot done={it.done} onClick={() => setItem(it.id, { done: !it.done })} />
            <AutoTextarea
              value={it.text}
              onChange={(v) => setItem(it.id, { text: v })}
              onKeyDown={(e) => onKey(e, i)}
              placeholder="Nueva tarea"
              inputRef={(el) => { if (el) refs.current.set(it.id, el); else refs.current.delete(it.id); }}
              className={cn("text-small", it.done ? "line-through text-mutedSoft" : "text-inkSoft")}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Quitar"
              className="shrink-0 mt-1.5 text-mutedSoft/50 hover:text-danger opacity-0 group-hover/it:opacity-100 transition text-[15px] leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sección en caja (Surface) con controles sutiles al pasar el ratón.
function SectionShell({ onUp, onDown, onDelete, children }) {
  return (
    <Surface variant="soft" pad="md" className="group/sec relative">
      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover/sec:opacity-100 focus-within:opacity-100 transition z-10">
        <IconButton label="Subir" onClick={onUp} disabled={!onUp}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
        </IconButton>
        <IconButton label="Bajar" onClick={onDown} disabled={!onDown}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </IconButton>
        <IconButton label="Eliminar sección" onClick={onDelete}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /></svg>
        </IconButton>
      </div>
      {children}
    </Surface>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────
export default function NotasClient({ initialNotes = [] }) {
  const doc = initialNotes[0] || null;
  const [sections, setSections] = useState(() => normalizeSections(doc?.items));

  const docIdRef = useRef(doc?.id || null);
  const ensuring = useRef(null);
  const ensureId = async () => {
    if (docIdRef.current) return docIdRef.current;
    if (!ensuring.current) {
      ensuring.current = createNote("checklist").then((r) => {
        if (r.ok) docIdRef.current = r.note.id;
        return docIdRef.current;
      });
    }
    return ensuring.current;
  };

  const saveTimer = useRef(null);
  const latest = useRef(sections);
  useEffect(() => { latest.current = sections; }, [sections]);
  const scheduleSave = (next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const id = await ensureId();
      if (id) updateNote(id, { items: next });
    }, 600);
  };
  const commit = (next) => { setSections(next); scheduleSave(next); };

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const hasContent = latest.current.length > 0;
    if (docIdRef.current || hasContent) ensureId().then((id) => id && updateNote(id, { items: latest.current }));
  }, []);

  const updateSection = (id, next) => commit(sections.map((s) => (s.id === id ? next : s)));
  const addSection = (kind) => commit([...sections, kind === "tasks" ? tasksSection() : textSection()]);
  const removeSection = (id) => commit(sections.filter((s) => s.id !== id));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = sections.slice();
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const AddBar = (
    <div className="flex flex-wrap items-center gap-4 text-small text-mutedSoft">
      <button type="button" onClick={() => addSection("text")} className="inline-flex items-center gap-1.5 hover:text-ink transition">
        <span className="text-[15px] leading-none">+</span> Texto
      </button>
      <button type="button" onClick={() => addSection("tasks")} className="inline-flex items-center gap-1.5 hover:text-ink transition">
        <span className="text-[15px] leading-none">+</span> Lista de tareas
      </button>
    </div>
  );

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <EmptyState>Tu bloc está vacío. Añade una sección de texto o una lista de tareas.</EmptyState>
        {AddBar}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((s, i) => (
        <SectionShell
          key={s.id}
          label={s.type === "tasks" ? "Lista de tareas" : "Texto"}
          onUp={i > 0 ? () => move(i, -1) : null}
          onDown={i < sections.length - 1 ? () => move(i, 1) : null}
          onDelete={() => removeSection(s.id)}
        >
          {s.type === "tasks" ? (
            <TasksSection section={s} onChange={(next) => updateSection(s.id, next)} />
          ) : (
            <TextSection section={s} onChange={(next) => updateSection(s.id, next)} first={i === 0} />
          )}
        </SectionShell>
      ))}

      <div className="pt-1">{AddBar}</div>
    </div>
  );
}
