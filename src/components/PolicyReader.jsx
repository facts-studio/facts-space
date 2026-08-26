"use client";

import { useMemo, useRef, useState } from "react";
import ContentBlocks from "@/components/ContentBlocks";
import { Tabs } from "@/components/ui";

// Las políticas largas se dividen en unas pocas páginas. El corte lo decide el
// contenido: cada { h: … } abre una página; los { h3: … } son subsecciones que
// viven dentro de ella. Así el agrupado se controla desde content.js y no se
// generan quince pestañas por accidente.
function toPages(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.h) { out.push({ title: b.h, blocks: [] }); continue; }
    if (!out.length) out.push({ title: "Resumen", blocks: [] });
    out[out.length - 1].blocks.push(b);
  }
  return out;
}

export default function PolicyReader({ blocks = [], children }) {
  const pages = useMemo(() => toPages(blocks), [blocks]);
  const [i, setI] = useState(0);
  const top = useRef(null);

  // Sin cortes declarados no hay nada que paginar: se lee del tirón.
  if (pages.length < 2) {
    return (
      <>
        <ContentBlocks blocks={blocks} />
        {children}
      </>
    );
  }

  const go = (n) => {
    setI(n);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const last = i === pages.length - 1;

  return (
    <div ref={top} className="scroll-mt-8">
      <Tabs
        value={i}
        onChange={go}
        tabs={pages.map((p, n) => ({ value: n, label: p.title }))}
        className="mb-7"
      />

      <ContentBlocks blocks={pages[i].blocks} />

      {/* El contenido extra de la política (p. ej. el checker de vacaciones)
          vive en la última página, que es donde se cierra la lectura. */}
      {last && children}

      {!last && (
        <button
          type="button"
          onClick={() => go(i + 1)}
          className="mt-10 text-[13px] text-muted hover:text-ink transition-colors"
        >
          {pages[i + 1].title} →
        </button>
      )}
    </div>
  );
}
