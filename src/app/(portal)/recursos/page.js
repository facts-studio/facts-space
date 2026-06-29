"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { TOOLS } from "@/lib/content";

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

function PanelList({ title, items, accent }) {
  return (
    <div>
      <h3 className="section-eyebrow mb-2.5">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-small text-inkSoft leading-relaxed">
            <span className={`mt-[0.1em] shrink-0 ${accent}`}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RecursosPage() {
  const [openId, setOpenId] = useState(null);
  const tool = TOOLS.find((t) => t.id === openId) || null;

  return (
    <div>
      <PageHeader
        eyebrow="Compartido"
        title="Recursos"
        helper="Las herramientas del día a día y las marcas del ecosistema Unfiltrade®."
      />

      <section className="mb-12">
        <div className={tool ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start" : ""}>
          {/* Cuadrícula de herramientas (estilo Políticas) */}
          <div className={`grid sm:grid-cols-2 gap-2 ${tool ? "lg:grid-cols-2" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
            {TOOLS.map((t, i) => {
              const num = String(i + 1).padStart(2, "0");
              const fav = favicon(t.url);
              const active = t.id === openId;
              return (
                <button
                  key={t.id}
                  onClick={() => setOpenId(active ? null : t.id)}
                  className={`group relative rounded-2xl min-h-[200px] p-6 flex flex-col items-center justify-center text-center transition ${
                    active ? "bg-surface ring-1 ring-borderStrong" : "bg-surface/55 hover:bg-surface"
                  }`}
                >
                  <span className="absolute top-5 left-5 text-micro text-mutedSoft tabular-nums">{num}</span>
                  {fav && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fav} alt="" className="w-10 h-10 rounded-xl mb-4" />
                  )}
                  <h2 className="text-title text-ink">{t.name}</h2>
                  <span className="text-micro text-mutedSoft mt-1">{t.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Columna derecha — ficha (estilo archivo, no flotante) */}
          {tool && (
            <aside key={tool.id} className="slide-in mt-6 lg:mt-0 lg:sticky lg:top-8 lg:border-l lg:border-border lg:pl-7">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  {favicon(tool.url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={favicon(tool.url)} alt="" className="w-10 h-10 rounded-xl" />
                  )}
                  <div>
                    <h2 className="text-title text-ink leading-tight">{tool.name}</h2>
                    <span className="text-micro text-mutedSoft">{tool.tag}</span>
                  </div>
                </div>
                <button onClick={() => setOpenId(null)} aria-label="Cerrar" className="h-7 w-7 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>

              <p className="text-small text-inkSoft leading-relaxed mb-5">{tool.what}</p>
              <div className="flex flex-col gap-5">
                <PanelList title="Cuándo lo usamos" items={tool.when} accent="text-brand" />
                <PanelList title="Qué evitar" items={tool.avoid} accent="text-danger" />
              </div>

              <a href={tool.url} target="_blank" rel="noreferrer" className="btn-primary w-full mt-6">Abrir {tool.name} ↗</a>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
