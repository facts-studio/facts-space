"use client";

// Los textos de SEO/GEO de una web, en limpio.
//
// Existe para que quien escribe (copy) pueda revisarlos sin pelearse con el
// panel técnico: aquí no hay comprobaciones, ni verdes ni rojos — solo el texto
// tal cual está publicado, con su longitud y el límite recomendado al lado, y
// un PDF para llevárselo o comentarlo con quien lo va a aplicar.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

// Límites recomendados. No son reglas del portal: son los cortes a partir de
// los cuales Google y las redes truncan el texto.
const LIMITES = {
  title: { max: 60, nota: "Google corta sobre los 60 caracteres" },
  description: { min: 140, max: 160, nota: "Entre 140 y 160 caracteres" },
  ogTitle: { max: 60, nota: "Máximo recomendado, 60" },
  ogDescription: { min: 110, max: 160, nota: "Entre 110 y 160 caracteres" },
};

function Campo({ etiqueta, clave, valor, ayuda }) {
  const limite = LIMITES[clave];
  const largo = (valor || "").length;
  const pasado = limite?.max && largo > limite.max;
  const corto = limite?.min && largo > 0 && largo < limite.min;

  return (
    <div className="py-4 border-b border-border/50 last:border-b-0 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-4 mb-1.5">
        <p className="text-micro uppercase tracking-[0.08em] text-mutedSoft">{etiqueta}</p>
        {valor ? (
          <span
            className={cn("text-micro tabular-nums shrink-0", pasado || corto ? "text-warn" : "text-mutedSoft")}
            title={limite?.nota}
          >
            {largo}
            {limite?.max ? ` / ${limite.max}` : ""}
          </span>
        ) : null}
      </div>
      {valor ? (
        <p className="text-body text-ink leading-relaxed whitespace-pre-wrap">{valor}</p>
      ) : (
        <p className="text-small text-mutedSoft italic">Vacío — no hay nada publicado en este campo.</p>
      )}
      {ayuda && <p className="text-micro text-mutedSoft mt-1.5">{ayuda}</p>}
    </div>
  );
}

function Bloque({ titulo, children }) {
  return (
    <section className="mb-8 break-inside-avoid">
      <h3 className="text-title text-ink mb-2">{titulo}</h3>
      <div className="rounded-2xl bg-surface/55 px-5">{children}</div>
    </section>
  );
}

export default function TextosSeo({ site, meta, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const og = meta?.og || {};
  const tw = meta?.twitter || {};
  const geo = meta?.geo || {};
  const titulares = meta?.titulares || {};

  if (typeof document === "undefined") return null;

  // Por portal al <body>: la ficha de la web se anima con transform, y un
  // ancestro transformado convierte a `fixed` en relativo a él — el diálogo se
  // quedaba encajonado en la columna en vez de centrarse en la pantalla.
  return createPortal(
    // `imprimible` marca lo único que sale en el PDF (ver globals.css).
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-8">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      <div className="imprimible relative flex flex-col w-full max-w-[900px] h-full sm:h-auto sm:max-h-[88vh] rounded-none sm:rounded-3xl bg-paper shadow-float overflow-hidden">
        <header className="shrink-0 flex items-start justify-between gap-4 bg-paper px-6 sm:px-8 pt-6 pb-4 border-b border-border/60">
          <div className="min-w-0 flex-1">
            <p className="section-eyebrow mb-1.5">Textos SEO / GEO</p>
            <h2 className="font-display text-[22px] leading-tight text-ink truncate">
              {site.title || meta?.host || site.url}
            </h2>
            <p className="text-micro text-mutedSoft mt-1 truncate">
              {meta?.host || site.url}
              {meta?.lang ? ` · idioma ${meta.lang}` : ""}
            </p>
          </div>
          <div className="sin-imprimir flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => window.print()} className="btn-ghost h-8 text-[12.5px]">
              Descargar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="h-8 w-8 grid place-items-center rounded-lg text-mutedSoft hover:text-ink hover:bg-surface2/70 transition"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
          <Bloque titulo="Buscador">
            <Campo
              etiqueta="Título de la página"
              clave="title"
              valor={meta?.title}
              ayuda="Es el titular azul del resultado en Google y el nombre de la pestaña."
            />
            <Campo
              etiqueta="Meta descripción"
              clave="description"
              valor={meta?.description}
              ayuda="El párrafo gris bajo el título en Google. No posiciona, pero decide si te pulsan."
            />
          </Bloque>

          <Bloque titulo="Al compartir el enlace">
            <Campo
              etiqueta="og:title"
              clave="ogTitle"
              valor={og.title}
              ayuda="Titular que se ve al pegar el enlace en WhatsApp, Slack o LinkedIn."
            />
            <Campo etiqueta="og:description" clave="ogDescription" valor={og.description} />
            <Campo etiqueta="og:site_name" valor={og.siteName} />
            <Campo etiqueta="Título en X / Twitter" valor={tw.title} ayuda="Si está vacío se usa el og:title." />
          </Bloque>

          {(titulares.h1?.length > 0 || titulares.h2?.length > 0) && (
            <Bloque titulo="Titulares de la página">
              {titulares.h1?.length > 0 && (
                <Campo
                  etiqueta="H1"
                  valor={titulares.h1.join("\n")}
                  ayuda="Debería haber uno solo, y decir de qué va la página."
                />
              )}
              {titulares.h2?.length > 0 && <Campo etiqueta="H2" valor={titulares.h2.join("\n")} />}
            </Bloque>
          )}

          <Bloque titulo="Para las IAs (GEO)">
            <Campo
              etiqueta="Datos estructurados"
              valor={meta?.jsonLdTypes?.length ? meta.jsonLdTypes.join(", ") : ""}
              ayuda="Le dicen a Google y a los modelos qué es cada cosa: una empresa, un artículo, una FAQ…"
            />
            <Campo
              etiqueta="llms.txt"
              valor={geo.llms ? "Publicado" : ""}
              ayuda="Guía para modelos de lenguaje, en la raíz de la web. Sin él, cada IA interpreta la web a su manera."
            />
            <Campo
              etiqueta="Bots de IA bloqueados"
              valor={geo.robots?.blocked?.length ? geo.robots.blocked.join(", ") : ""}
              ayuda={geo.robots?.present ? "Los que el robots.txt no deja entrar." : "Esta web no tiene robots.txt."}
            />
          </Bloque>

          <Bloque titulo="Referencia técnica">
            <Campo
              etiqueta="URL canónica"
              valor={meta?.canonical}
              ayuda="La dirección buena de esta página cuando hay varias que llevan al mismo sitio."
            />
            <Campo
              etiqueta="Indexación (robots)"
              valor={meta?.robots}
              ayuda="Vacío significa que se indexa con normalidad."
            />
          </Bloque>

          <p className="text-micro text-mutedSoft">
            Estos textos están rastreados de la web publicada. Para cambiar cualquiera de ellos hay que tocarlos en su
            código.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
