"use client";

import { useEffect, useRef, useState } from "react";
import { Surface } from "@/components/ui";
import { cn } from "@/lib/cn";
import { createNote, updateNote } from "@/lib/actions/notes";

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

const emptyText = () => ({ id: uid(), type: "text", text: "", done: false });
const normalize = (items) =>
  (Array.isArray(items) ? items : [])
    .map((b) => ({ id: b.id || uid(), type: b.type === "todo" ? "todo" : "text", text: b.text || "", done: !!b.done }));

// Textarea que crece con el contenido; reenvía su nodo para gestionar el foco.
function AutoTextarea({ value, onChange, onKeyDown, placeholder, className, inputRef }) {
  const ref = useRef(null);
  const setRefs = (el) => { ref.current = el; inputRef?.(el); };
  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(grow, [value]);
  return (
    <textarea
      ref={setRefs}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={grow}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className={cn("w-full bg-transparent resize-none outline-none leading-relaxed placeholder:text-mutedSoft/70", className)}
    />
  );
}

// Casilla de tarea.
function Check({ done, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={cn(
        "shrink-0 h-[18px] w-[18px] grid place-items-center rounded-md border transition",
        done ? "bg-ink border-ink text-bg" : "border-borderStrong text-transparent hover:border-ink"
      )}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </button>
  );
}

// Editor de bloc único (estilo Notion): párrafos de texto y tareas mezclados.
export default function NotasClient({ initialNotes = [] }) {
  const doc = initialNotes[0] || null;
  const initial = normalize(doc?.items);
  const [blocks, setBlocks] = useState(initial.length ? initial : [emptyText()]);

  // Id del documento (fila de notes). Se crea perezosamente al primer guardado.
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

  // Autoguardado con debounce.
  const saveTimer = useRef(null);
  const latest = useRef(blocks);
  useEffect(() => { latest.current = blocks; }, [blocks]);
  const scheduleSave = (next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const id = await ensureId();
      if (id) updateNote(id, { items: next });
    }, 600);
  };
  const commit = (next) => { setBlocks(next); scheduleSave(next); };

  // Al desmontar (p. ej. volver a Inicio) guarda lo pendiente; no crea docs vacíos.
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const hasContent = latest.current.some((b) => (b.text || "").trim() || b.type === "todo");
    if (docIdRef.current || hasContent) ensureId().then((id) => id && updateNote(id, { items: latest.current }));
  }, []);

  // Gestión de foco tras insertar/borrar bloques.
  const refs = useRef(new Map());
  const focusNext = useRef(null); // { id, atEnd }
  useEffect(() => {
    const f = focusNext.current;
    if (!f) return;
    focusNext.current = null;
    const el = refs.current.get(f.id);
    if (el) { el.focus(); const p = f.atEnd ? el.value.length : 0; el.setSelectionRange(p, p); }
  });

  const setText = (i, text) => {
    // Atajo markdown: "[] " o "[ ] " al inicio convierte el bloque en tarea.
    if (blocks[i].type === "text" && /^\[\s?\]\s$/.test(text)) {
      commit(blocks.map((b, j) => (j === i ? { ...b, type: "todo", text: "" } : b)));
      return;
    }
    commit(blocks.map((b, j) => (j === i ? { ...b, text } : b)));
  };
  const toggleDone = (i) => commit(blocks.map((b, j) => (j === i ? { ...b, done: !b.done } : b)));
  const setType = (i, type) => commit(blocks.map((b, j) => (j === i ? { ...b, type } : b)));

  const addAfter = (i, type = "text") => {
    const nb = { id: uid(), type, text: "", done: false };
    focusNext.current = { id: nb.id, atEnd: false };
    commit([...blocks.slice(0, i + 1), nb, ...blocks.slice(i + 1)]);
  };
  const removeAt = (i) => {
    if (blocks.length === 1) { commit([emptyText()]); return; }
    const prev = blocks[i - 1];
    if (prev) focusNext.current = { id: prev.id, atEnd: true };
    commit(blocks.filter((_, j) => j !== i));
  };

  const onKey = (e, i) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addAfter(i, blocks[i].type === "todo" ? "todo" : "text");
    } else if (e.key === "Backspace") {
      const el = e.target;
      if (el.selectionStart === 0 && el.selectionEnd === 0 && blocks[i].text === "") {
        e.preventDefault();
        if (blocks[i].type === "todo") setType(i, "text"); // tarea vacía → texto
        else removeAt(i); // texto vacío → fusiona con el anterior
      }
    }
  };

  return (
    <Surface className="min-h-[340px]">
      <div className="flex flex-col">
        {blocks.map((b, i) => (
          <div key={b.id} className="group/b flex items-start gap-2 -mx-1.5 px-1.5 rounded-lg hover:bg-surface2/25 transition-colors">
            <div className="pt-[4px] w-5 shrink-0 flex justify-center">
              {b.type === "todo" ? (
                <Check done={b.done} onClick={() => toggleDone(i)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setType(i, "todo")}
                  title="Convertir en tarea"
                  aria-label="Convertir en tarea"
                  className="h-[18px] w-[18px] rounded-md border border-transparent group-hover/b:border-borderStrong transition"
                />
              )}
            </div>
            <AutoTextarea
              value={b.text}
              onChange={(v) => setText(i, v)}
              onKeyDown={(e) => onKey(e, i)}
              placeholder={i === 0 ? "Escribe algo, o «[] » para una tarea…" : ""}
              inputRef={(el) => { if (el) refs.current.set(b.id, el); else refs.current.delete(b.id); }}
              className={cn("text-small py-0.5", b.type === "todo" && b.done ? "line-through text-mutedSoft" : "text-inkSoft")}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addAfter(blocks.length - 1, "text")}
        className="mt-2 ml-[26px] inline-flex items-center gap-1.5 text-micro text-mutedSoft hover:text-ink transition"
      >
        <span className="text-[14px] leading-none">+</span> Añadir bloque
      </button>
    </Surface>
  );
}
