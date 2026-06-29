"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { CLIENTS } from "@/lib/content";

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

function Field({ label, children }) {
  return (
    <div>
      <h3 className="section-eyebrow mb-2">{label}</h3>
      {children}
    </div>
  );
}

function Panel({ brand, onClose }) {
  const fav = brand.links?.[0] ? favicon(brand.links[0].url) : null;
  return (
    <aside key={brand.id} className="slide-in mt-6 lg:mt-0 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:border-border lg:pl-7">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {fav && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fav} alt="" className="w-10 h-10 rounded-xl" />
          )}
          <div>
            <h2 className="text-title text-ink leading-tight">{brand.name}</h2>
            {brand.tagline && <span className="text-micro text-mutedSoft italic">«{brand.tagline}»</span>}
          </div>
        </div>
        <button onClick={onClose} aria-label="Cerrar" className="h-7 w-7 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <p className="text-small text-inkSoft leading-relaxed mb-6">{brand.desc}</p>

      <div className="flex flex-col gap-6">
        <Field label="Enlaces">
          <div className="flex flex-col gap-1.5">
            {brand.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-small text-ink hover:text-brand transition group">
                <span>{l.label}</span>
                <span className="text-mutedSoft group-hover:text-brand">↗</span>
              </a>
            ))}
          </div>
        </Field>

        <Field label="Drive">
          {brand.drive ? (
            <a href={brand.drive} target="_blank" rel="noreferrer" className="text-small text-ink hover:text-brand transition">Abrir carpeta ↗</a>
          ) : (
            <span className="text-small text-mutedSoft">Sin enlace todavía</span>
          )}
        </Field>

        <Field label="Brandbook / Design system">
          <div className="rounded-xl bg-surface2/50 border border-dashed border-borderStrong/60 px-4 py-5 text-center">
            <p className="text-small text-mutedSoft">En desarrollo</p>
          </div>
        </Field>
      </div>
    </aside>
  );
}

export default function ClientesPage() {
  const [openId, setOpenId] = useState(null);
  const openBrand = CLIENTS.find((x) => x.id === openId) || null;

  return (
    <div>
      <PageHeader
        eyebrow="Para quién trabajamos"
        title="Clientes"
        helper="F*cts es una sociedad independiente que da servicio a sus clientes. Cada uno con su web, su responsable y sus recursos."
      />

      <div className={openBrand ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start" : ""}>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {CLIENTS.map((b) => {
            const fav = b.links?.[0] ? favicon(b.links[0].url) : null;
            const active = b.id === openId;
            return (
              <button
                key={b.id}
                onClick={() => setOpenId(active ? null : b.id)}
                className={`group rounded-2xl p-6 min-h-[260px] flex flex-col text-left transition ${
                  active ? "bg-surface ring-1 ring-borderStrong" : "bg-surface/55 hover:bg-surface"
                }`}
              >
                {fav ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fav} alt="" className="w-10 h-10 rounded-xl" />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-brandSoft text-brand grid place-items-center text-[16px]">✳</span>
                )}
                <div className="mt-auto pt-6">
                  <h3 className="text-title text-ink group-hover:text-brand transition-colors">{b.name}</h3>
                  {b.tagline && <p className="text-micro text-mutedSoft italic">«{b.tagline}»</p>}
                  <p className="text-small text-muted leading-relaxed mt-2 line-clamp-2">{b.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {openBrand && <Panel brand={openBrand} onClose={() => setOpenId(null)} />}
      </div>
    </div>
  );
}
