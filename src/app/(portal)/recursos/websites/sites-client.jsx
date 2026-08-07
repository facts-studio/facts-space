"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Surface, Select, Badge, Button, Field, Input, EmptyState, ScreenHeader, ProgressBar } from "@/components/ui";
import { paletteColor, CLIENT_COLORS } from "@/lib/client-palette";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { createSite, updateSite, deleteSite, fetchSiteMeta, analyzeSiteMeta, checkEmbeddable, fetchSiteTraffic } from "@/lib/actions/sites";

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
// "https://github.com/org/repo/" → "org/repo" (o el host si no es reconocible).
const repoLabel = (url) => {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    return path || u.hostname.replace(/^www\./, "");
  } catch { return url; }
};
const favicon = (url) => { try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; } };

// Tinte del cliente (o del propio nombre de la web si no hay cliente).
const tintOf = (s) => paletteColor(s.client || s.title || s.url, s.color);

// Favicon con red: el servicio de Google y, si falla (p. ej. subdominios que no
// tiene indexados → globo/404), cae a la inicial teñida. Nada de globos genéricos.
function SiteFavicon({ site, tint, className }) {
  const [failed, setFailed] = useState(false);
  const src = favicon(site.url);
  if (failed || !src) {
    return (
      <span className={cn("grid place-items-center text-[15px] shrink-0", className)} style={{ backgroundColor: tint.bg, color: tint.fg }}>
        {(site.title || hostOf(site.url) || "?")[0]?.toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" onError={() => setFailed(true)} className={cn("bg-surface2 shrink-0", className)} />;
}

// ── Tarjeta de la galería ────────────────────────────────────────────────────
function SiteCard({ site, active, onOpen }) {
  const tint = tintOf(site);
  return (
    <button
      onClick={onOpen}
      className={`group text-left rounded-2xl overflow-hidden bg-surface/55 hover:bg-surface transition ${
        active ? "ring-1 ring-borderStrong" : ""
      }`}
    >
      {/* Preview 16:10: captura/og:image o, si no hay, un lienzo teñido con la inicial */}
      <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: tint.bg }}>
        {site.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-[40px]" style={{ color: tint.fg }}>
            {(site.title || hostOf(site.url))[0]?.toUpperCase()}
          </span>
        )}
        {!site.active && (
          <span className="absolute top-2.5 left-2.5"><Badge kind="neutral">Inactiva</Badge></span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-body font-medium text-ink truncate">{site.title || hostOf(site.url)}</h3>
        </div>
        <p className="text-micro text-mutedSoft truncate mt-0.5">{hostOf(site.url)}</p>
        {(site.client || site.tags?.length) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {site.client && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: tint.bg, color: tint.fg }}>
                {site.client}
              </span>
            )}
            {(site.tags || []).slice(0, 2).map((t) => (
              <Badge key={t} kind="neutral">{t}</Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// Iconos de estado del análisis (✓ / aviso). Pequeños, en línea con el texto.
const CheckOk = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const CheckWarn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
);

// Fila del repaso. `thumb` = URL de imagen → muestra miniatura a la derecha.
// `note` = apunte suave (p. ej. longitud SEO). `tone`: "ok" | "warn".
function MetaRow({ label, ok, value, warn, note, thumb }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0">
      <span className={`mt-[1px] shrink-0 ${ok ? "text-success" : "text-warn"}`}>{ok ? <CheckOk /> : <CheckWarn />}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-ink flex items-center gap-2">
          {label}
          {note && <span className="text-micro text-mutedSoft font-normal">· {note}</span>}
        </p>
        {ok && value ? (
          <p className="text-micro text-mutedSoft break-words line-clamp-2">{value}</p>
        ) : (
          <p className="text-micro text-warn/90">{warn || "No declarado"}</p>
        )}
      </div>
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-9 w-14 shrink-0 rounded-md object-cover bg-surface2" />
      )}
    </div>
  );
}

// Chip informativo (og:type, twitter card…). Neutro, sin peso.
function InfoChip({ label, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface2/70 px-2.5 py-1 text-micro text-inkSoft">
      <span className="text-mutedSoft">{label}</span>
      <span className="text-ink">{value}</span>
    </span>
  );
}

const scoreTone = (pct) => (pct >= 80 ? "success" : pct >= 45 ? "warn" : "danger");

// ── Prompts de arreglo por grupo ─────────────────────────────────────────────
// Uno común por problema (igual para todas las webs): pega el prompt en el
// proyecto de la web y Claude audita, completa lo que falta (pidiendo lo que no
// pueda inferir) y explica cómo testearlo. Escritos como brief de especialista.
function promptFor(key) {
  const head = `Actúa como especialista senior. Trabajas dentro del código del proyecto de esta web. No inventes datos de marca ni de negocio: si te falta algo (nombre exacto, claims, handles sociales, imágenes, idioma objetivo, keyword principal…), pídemelo antes de escribirlo. Primero AUDITA el estado actual leyendo el código real, luego lístame lo que falta o está mal, y por último IMPLEMENTA los cambios en los archivos que toquen. Al final, dime cómo verificarlo.`;

  const bodies = {
    icons: `${head}

Rol: especialista en identidad web y PWA icons.

Revisa y completa el set de iconos de la web:
- favicon.ico multi-tamaño (16/32/48) en la raíz.
- favicon.svg (vectorial, con soporte de dark mode si aplica).
- apple-touch-icon 180×180 (fondo sólido, sin transparencia, esquinas cuadradas: iOS las redondea).
- Iconos PWA 192×192 y 512×512, más una versión "maskable" con safe-area.
- <meta name="theme-color"> (y variante para dark si hay).
- manifest.webmanifest completo: name, short_name, icons[], start_url, scope, display, background_color, theme_color.
- <link> correctos en el <head> apuntando a cada recurso.

Procede: genera el set a partir del logo de origen (pídemelo si no está en el repo, idealmente SVG). Enlaza todo en el head y valida rutas absolutas.
Testea: pásalo por realfavicongenerator (checker), instala la web como PWA y comprueba el icono en iOS y Android, y que no queden 404 de iconos.`,

    og: `${head}

Rol: especialista en Open Graph y social sharing.

Deja perfecta la tarjeta que se ve al compartir en redes/WhatsApp/Slack:
- og:title (≤ 60 car., sin relleno), og:description (110–160 car., con gancho), og:type, og:url (canónica y absoluta), og:site_name, og:locale.
- og:image: 1200×630 px, < 5 MB, JPG/PNG, URL ABSOLUTA y accesible (200 + content-type image/*). Añade og:image:width/height y og:image:alt.
- Twitter: twitter:card = summary_large_image, twitter:title, twitter:description, twitter:image y twitter:image:alt.
- Overrides por página (cada plantilla/landing con su título, descripción e imagen propios; nada de una sola meta global).

Procede: audita el <head> de cada plantilla, corrige lo que falte, y si no hay og:image genera una plantilla 1200×630 con marca (pídeme el logo/tono si hace falta). Evita imágenes que devuelvan error o rutas relativas.
Testea: Facebook Sharing Debugger, Twitter/X Card Validator y opengraph.xyz; vuelve a "scrapear" para limpiar caché y confirma que la preview se ve bien.`,

    seo: `${head}

Rol: SEO técnico senior (on-page e indexación).

Audita y completa el SEO on-page de cada página:
- <title> único por página, 50–60 car., con la keyword principal delante y sufijo de marca.
- meta description única, 140–160 car., con propuesta de valor y CTA (no keyword stuffing).
- Un único <h1> por página + jerarquía coherente de H2/H3.
- <link rel="canonical"> absoluto y correcto (ojo con duplicados y parámetros).
- meta robots coherente con la intención (index,follow salvo páginas que no deban indexarse).
- <html lang> correcto; hreflang si hay más de un idioma.
- sitemap.xml actualizado y referenciado en robots.txt; URLs limpias y semánticas.
- alt descriptivos en imágenes, enlazado interno con anchors útiles, datos de contacto/NAP si es local.

Procede: pregúntame la keyword/intención objetivo de cada página clave si no está clara. Corrige en código sin canibalizar keywords entre páginas.
Testea: inspección de URL en Google Search Console, test de resultados enriquecidos, Lighthouse (SEO) y un crawl (p. ej. Screaming Frog) para detectar títulos/descripciones duplicados o faltantes.`,

    geo: `${head}

Rol: especialista en GEO (Generative Engine Optimization) — que las IAs (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews) te entiendan y te citen.

Audita y completa las señales para motores generativos:
- llms.txt en la raíz (Markdown): resumen de qué es el sitio + enlaces clave con una línea de contexto cada uno. Opcional llms-full.txt con el contenido en texto plano.
- robots.txt: decide conmigo si permitir o bloquear los bots de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) y déjalo explícito. Incluye la línea Sitemap.
- JSON-LD (Schema.org) según el tipo real: Organization + WebSite siempre; y Product/Course/Event/Article/LocalBusiness según corresponda. Incluye sameAs con los perfiles sociales.
- FAQPage con las dudas frecuentes reales (oro para que la IA extraiga pregunta→respuesta).
- Contenido extraíble: respuestas directas, definiciones, encabezados claros, sin enterrar la info en JS.

Procede: pregúntame el tipo de entidad, los perfiles sociales y las FAQ reales antes de generarlas. No te inventes datos.
Testea: valida el JSON-LD (Schema Markup Validator y Rich Results Test), comprueba que llms.txt y robots.txt responden 200 y son coherentes, y revisa que los bots de IA no estén bloqueados sin querer.`,

    tech: `${head}

Rol: technical SEO y performance web.

Audita y corrige la base técnica:
- <!doctype html>, <meta charset="utf-8"> y <meta name="viewport"> correctos.
- HTTPS en todo, sin contenido mixto; redirecciones limpias (301, sin cadenas).
- Core Web Vitals: LCP < 2,5 s, CLS < 0,1, INP < 200 ms. Prioriza por impacto.
- Imágenes en WebP/AVIF, con width/height para evitar CLS, lazy-load salvo la del hero; precarga de la fuente y de la imagen LCP.
- Caché, compresión (gzip/brotli), minificado; nada de JS bloqueante innecesario.
- Sin errores en consola; página 404 útil; accesibilidad básica (contraste, foco visible, alt, landmarks/aria).

Procede: mide primero, luego corrige lo de mayor impacto. Explícame el porqué de cada cambio.
Testea: Lighthouse/PageSpeed Insights (móvil y escritorio), WebPageTest, axe DevTools para accesibilidad y el validador de HTML del W3C.`,
  };

  return { title: PROMPT_TITLES[key] || "Prompt", body: bodies[key] || head };
}

const PROMPT_TITLES = {
  icons: "Iconos e identidad",
  og: "Open Graph y Twitter",
  seo: "SEO e indexación",
  geo: "GEO · optimización para IA",
  tech: "Técnico y performance",
};

// Popup con el prompt listo para copiar y pegar en el proyecto de la web.
function PromptModal({ groupKey, onClose }) {
  const { title, body } = promptFor(groupKey);
  const [copied, setCopied] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* sin permiso de portapapeles: el usuario puede seleccionar a mano */ }
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 bg-ink/30 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <Surface className="w-full max-w-2xl my-auto max-h-[90vh] flex flex-col !bg-paper shadow-float" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <p className="section-eyebrow !mb-1">Prompt para Claude</p>
            <h2 className="text-title text-ink leading-tight">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="text-micro text-mutedSoft mb-3">Pégalo en el proyecto de la web y Claude auditará, completará lo que falte (pidiéndote lo que no pueda inferir) y te dirá cómo verificarlo.</p>
        <pre className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-surface2/50 p-4 text-[12px] leading-relaxed text-inkSoft whitespace-pre-wrap font-mono">{body}</pre>
        <div className="mt-4">
          <Button onClick={copiar}>{copied ? "Copiado ✓" : "Copiar prompt"}</Button>
        </div>
      </Surface>
    </div>,
    document.body
  );
}

// Icono "prompt de IA" (chispas) para la cabecera de grupo.
const SparkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
);

// Contenedor de grupo: cabecera (título + prompt + fracción + mini-barra) y contenido.
function MetaGroup({ title, passed, total, promptKey, children }) {
  const pct = total ? Math.round((passed / total) * 100) : null;
  const [showPrompt, setShowPrompt] = useState(false);
  return (
    <Surface className="!bg-surface/45 !p-4">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="section-eyebrow !mb-0">{title}</h3>
        {promptKey && (
          <button
            onClick={() => setShowPrompt(true)}
            title="Prompt para arreglarlo con Claude"
            aria-label="Ver prompt para arreglarlo"
            className="h-6 w-6 grid place-items-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/70 transition"
          >
            <SparkIcon />
          </button>
        )}
        <span className="flex-1" />
        {pct != null && (
          <>
            <span className="text-micro text-mutedSoft tabular-nums shrink-0">{passed}/{total}</span>
            <ProgressBar value={passed} max={total} tone={scoreTone(pct)} className="w-16 shrink-0" />
          </>
        )}
      </div>
      {children}
      {showPrompt && <PromptModal groupKey={promptKey} onClose={() => setShowPrompt(false)} />}
    </Surface>
  );
}

const count = (arr) => arr.filter(Boolean).length;

// Panel "Meta": nivel general + grupos (compartir, iconos, OG, SEO, GEO, técnico).
function MetaPanel({ meta, state, site }) {
  const tint = tintOf(site);
  if (state === "loading" || state === "idle") {
    return <div className="h-full grid place-items-center text-small text-mutedSoft">Analizando la web…</div>;
  }
  if (state === "error") {
    return <div className="h-full grid place-items-center px-6 text-center text-small text-danger">{meta?.error || "No se pudo analizar."}</div>;
  }

  const shareTitle = meta.og.title || meta.title || meta.host;
  const shareDesc = meta.og.description || meta.description;
  const imgOk = meta.og.imageStatus?.ok;
  const favSrc = meta.favicon?.status?.ok ? meta.favicon.href : meta.googleFavicon;
  const appleOk = meta.appleIcon?.status?.ok;
  const indexable = !/noindex/i.test(meta.robots || "");
  const twImg = meta.twitter.image;
  const b = Boolean;

  const len = (s) => (s || "").length;
  const titleNote = meta.title ? `${len(meta.title)} car.${len(meta.title) > 60 ? " · algo largo" : ""}` : null;
  const descNote = meta.description ? `${len(meta.description)} car.${len(meta.description) > 160 ? " · algo larga" : ""}` : null;

  // GEO: ¿deja pasar a los bots de IA? Sin robots.txt = acceso libre (ok).
  const g = meta.geo || { llms: false, robots: { present: false, blocked: [] }, faq: false };
  const robotsAiOk = !g.robots.present || g.robots.blocked.length === 0;
  const jsonTypes = meta.jsonLdTypes || [];

  // Señales por grupo (para las mini-barras y el nivel general).
  const gShare = [b(meta.og.title), b(meta.og.description), b(imgOk), b(meta.twitter.card)];
  const gIcons = [b(meta.favicon?.status?.ok), b(appleOk), b(meta.themeColor)];
  const gSeo = [b(meta.title), b(meta.description), b(meta.canonical), indexable, b(meta.lang)];
  const gGeo = [b(g.llms), robotsAiOk, b(meta.hasJsonLd)];
  const gTech = [b(meta.viewport), b(meta.charset), meta.h1Count >= 1];
  const all = [...gShare, ...gIcons, ...gSeo, ...gGeo, ...gTech];
  const overall = Math.round((count(all) / all.length) * 100);

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-4">
      {/* Nivel general */}
      <Surface className="!bg-surface/45 !p-4">
        <div className="flex items-end justify-between mb-2.5">
          <div>
            <p className="section-eyebrow !mb-0">Nivel general</p>
            <p className="text-micro text-mutedSoft mt-1">{count(all)} de {all.length} señales</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge kind={indexable ? "success" : "danger"}>{indexable ? "Indexable" : "noindex"}</Badge>
            <span className="text-[26px] leading-none font-display text-ink tabular-nums">{overall}<span className="text-body text-mutedSoft">%</span></span>
          </div>
        </div>
        <ProgressBar value={overall} max={100} tone={scoreTone(overall)} size="md" />
      </Surface>

      {/* Al compartir — tarjeta social */}
      <MetaGroup title="Al compartir">
        <div className="rounded-xl overflow-hidden bg-paper w-full max-w-md shadow-soft">
          <div className="aspect-[1.91/1] overflow-hidden grid place-items-center" style={{ backgroundColor: tint.bg }}>
            {imgOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.og.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-micro" style={{ color: tint.fg }}>{meta.og.image ? "Imagen rota" : "Sin imagen para compartir"}</span>
            )}
          </div>
          <div className="p-3">
            <p className="text-[10.5px] uppercase tracking-wide text-mutedSoft">{meta.host}</p>
            <p className="text-small text-ink font-medium truncate">{shareTitle}</p>
            {shareDesc && <p className="text-micro text-mutedSoft line-clamp-2 mt-0.5">{shareDesc}</p>}
          </div>
        </div>
        {!imgOk && (
          <p className="mt-2 text-micro text-warn/90">
            {meta.og.image ? `La og:image devuelve error (${meta.og.imageStatus?.status || "no carga"}).` : "Falta la meta og:image (1200×630 recomendado)."}
          </p>
        )}
        {(meta.og.type || meta.og.siteName || meta.twitter.card) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <InfoChip label="og:type" value={meta.og.type} />
            <InfoChip label="site" value={meta.og.siteName} />
            <InfoChip label="twitter" value={meta.twitter.card} />
          </div>
        )}
      </MetaGroup>

      {/* Iconos */}
      <MetaGroup title="Iconos" passed={count(gIcons)} total={gIcons.length} promptKey="icons">
        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={favSrc} alt="" className="h-8 w-8 rounded-md bg-surface2" />
            <div>
              <p className="text-[12.5px] text-ink">Favicon</p>
              <p className="text-micro text-mutedSoft">{meta.favicon?.status?.ok ? "En la web" : "Vía Google"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {appleOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.appleIcon.href} alt="" className="h-11 w-11 rounded-[11px] bg-surface2" />
            ) : (
              <span className="h-11 w-11 rounded-[11px] grid place-items-center text-warn bg-surface2"><CheckWarn /></span>
            )}
            <div>
              <p className="text-[12.5px] text-ink">Icono de instalación</p>
              <p className="text-micro text-mutedSoft">{appleOk ? "apple-touch-icon" : "No declarado"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {meta.themeColor ? (
              <span className="h-8 w-8 rounded-md border border-border/60 shrink-0" style={{ backgroundColor: meta.themeColor }} />
            ) : (
              <span className="h-8 w-8 rounded-md grid place-items-center text-warn bg-surface2"><CheckWarn /></span>
            )}
            <div>
              <p className="text-[12.5px] text-ink">Color de tema</p>
              <p className="text-micro text-mutedSoft">{meta.themeColor || "No declarado"}</p>
            </div>
          </div>
        </div>
      </MetaGroup>

      {/* Open Graph y Twitter (con miniaturas) */}
      <MetaGroup title="Open Graph y Twitter" passed={count(gShare)} total={gShare.length} promptKey="og">
        <MetaRow label="og:title" ok={b(meta.og.title)} value={meta.og.title} />
        <MetaRow label="og:description" ok={b(meta.og.description)} value={meta.og.description} />
        <MetaRow label="og:image" ok={b(imgOk)} value={meta.og.image} warn={meta.og.image ? "Declarada pero no carga" : "No declarada"} thumb={imgOk ? meta.og.image : null} />
        <MetaRow label="Twitter card" ok={b(meta.twitter.card)} value={meta.twitter.card} />
        {twImg && <MetaRow label="twitter:image" ok value={twImg} thumb={twImg} />}
      </MetaGroup>

      {/* SEO e indexación */}
      <MetaGroup title="SEO e indexación" passed={count(gSeo)} total={gSeo.length} promptKey="seo">
        <MetaRow label="Título" ok={b(meta.title)} value={meta.title} warn="Falta <title>" note={titleNote} />
        <MetaRow label="Descripción" ok={b(meta.description)} value={meta.description} warn="Falta meta description" note={descNote} />
        <MetaRow label="Canonical" ok={b(meta.canonical)} value={meta.canonical} />
        <MetaRow label="Indexación" ok={indexable} value={meta.robots || "index, follow (por defecto)"} warn="Bloqueada (noindex)" />
        <MetaRow label="Idioma (lang)" ok={b(meta.lang)} value={meta.lang} />
      </MetaGroup>

      {/* GEO / IA */}
      <MetaGroup title="GEO · optimización para IA" passed={count(gGeo)} total={gGeo.length} promptKey="geo">
        <MetaRow label="llms.txt" ok={b(g.llms)} value="Presente (guía para modelos)" warn="No encontrado" />
        <MetaRow
          label="Bots de IA (robots.txt)"
          ok={robotsAiOk}
          value={g.robots.present ? (g.robots.blocked.length ? `Bloquea ${g.robots.blocked.join(", ")}` : "Permite GPTBot, ClaudeBot, Perplexity…") : "Sin robots.txt (acceso libre)"}
          warn={`Bloquea ${g.robots.blocked.join(", ")}`}
        />
        <MetaRow label="Datos estructurados" ok={b(meta.hasJsonLd)} value={jsonTypes.length ? jsonTypes.join(", ") : "JSON-LD presente"} warn="Sin JSON-LD" />
        <MetaRow label="FAQ (Schema)" ok={b(g.faq)} value="FAQPage presente" warn="Sin FAQPage (opcional)" />
        {jsonTypes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {jsonTypes.map((t) => <InfoChip key={t} label="type" value={t} />)}
          </div>
        )}
      </MetaGroup>

      {/* Técnico */}
      <MetaGroup title="Técnico" passed={count(gTech)} total={gTech.length} promptKey="tech">
        <MetaRow label="Viewport" ok={b(meta.viewport)} value={meta.viewport} />
        <MetaRow label="Codificación" ok={b(meta.charset)} value={meta.charset} warn="Sin charset" />
        <MetaRow label="Encabezado H1" ok={meta.h1Count >= 1} value={`${meta.h1Count} en la página`} warn="Sin H1" note={meta.h1Count > 1 ? "varios" : null} />
      </MetaGroup>
    </div>
  );
}

// ── Detalle: la web en vivo (iframe) + ficha a la derecha ────────────────────
// KPI grande del panel de tráfico.
function TrafficStat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-surface/55 p-5">
      <p className="section-eyebrow mb-2">{label}</p>
      <p className="font-display text-[28px] leading-none text-ink tabular-nums">{value}</p>
      {sub ? <p className="text-micro text-mutedSoft mt-1.5">{sub}</p> : null}
    </div>
  );
}

// Gráfico de línea (sesiones/día) — SVG inline, se estira al ancho. Trazo de
// grosor constante (non-scaling-stroke) y área tenue con el color de la web.
function TrafficChart({ series = [], color }) {
  const pts = series.filter((d) => d && d.date);
  if (pts.length < 2) return <p className="text-small text-mutedSoft">Aún no hay suficientes datos para el gráfico.</p>;
  const max = Math.max(1, ...pts.map((d) => d.sessions));
  const W = 100, H = 40, n = pts.length;
  const x = (i) => (i / (n - 1)) * W;
  const y = (v) => H - (v / max) * H;
  const line = pts.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(d.sessions).toFixed(2)}`).join(" ");
  const area = `${line} L${W.toFixed(2)},${H} L0,${H} Z`;
  return (
    <div className="rounded-2xl bg-surface/55 p-5" style={{ color }}>
      <div className="flex items-baseline justify-between mb-3">
        <p className="section-eyebrow">Sesiones · últimos 30 días</p>
        <span className="text-micro text-mutedSoft tabular-nums">pico {max.toLocaleString("es-ES")}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-40 block" role="img" aria-label="Sesiones por día en los últimos 30 días">
        <path d={area} fill="currentColor" opacity="0.10" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between mt-2 text-micro text-mutedSoft tabular-nums">
        <span>{fmtDay(pts[0].date)}</span>
        <span>{fmtDay(pts[pts.length - 1].date)}</span>
      </div>
    </div>
  );
}

function fmtDay(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// Panel "Tráfico": KPIs + gráfico de 30 días desde GA4.
function TrafficPanel({ data, state, tint }) {
  const color = tint?.fg || "rgb(var(--ct-ink))";
  if (state !== "done") {
    const err = state === "error";
    return (
      <div className="p-6 h-full grid place-items-center text-center">
        <div>
          {err ? (
            <>
              <p className="text-body text-ink">Sin datos de tráfico</p>
              <p className="text-micro text-mutedSoft mt-1 max-w-[34ch] mx-auto">{data?.error || "No se pudo leer GA4."}</p>
            </>
          ) : (
            <p className="text-small text-mutedSoft inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /></svg>
              Cargando tráfico…
            </p>
          )}
        </div>
      </div>
    );
  }
  const nf = (v) => Number(v || 0).toLocaleString("es-ES");
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <TrafficStat label="Usuarios" value={nf(data.users)} sub="30 días" />
        <TrafficStat label="Sesiones" value={nf(data.sessions)} sub="30 días" />
        <TrafficStat label="Páginas vistas" value={nf(data.views)} sub="30 días" />
      </div>
      <TrafficChart series={data.series} color={color} />
      <p className="text-micro text-mutedSoft">Fuente: Google Analytics 4.</p>
    </div>
  );
}

function SiteDetail({ site, onClose }) {
  const tint = tintOf(site);
  // "web" = la web embebida (puede quedar en blanco si bloquea el iframe);
  // "meta" = análisis de metadatos (compartir, iconos, SEO), cargado al vuelo.
  const [view, setView] = useState("web"); // "web" | "meta" | "trafico"
  const [meta, setMeta] = useState(null);
  const [metaState, setMetaState] = useState("idle"); // idle | done | error
  const [runId, setRunId] = useState(0); // ↑ fuerza un re-análisis
  const doneFor = useRef(-1); // último runId ya analizado (evita refetch en bucle)
  const [embed, setEmbed] = useState("checking"); // checking | ok | blocked
  const [traffic, setTraffic] = useState(null);
  const [trafficState, setTrafficState] = useState("idle"); // idle | done | error
  const askedTraffic = useRef(false); // evita repetir la llamada a GA4

  // ¿La web deja embeberse? Si sus cabeceras lo bloquean, en vez del iframe en
  // blanco mostramos un recuadro. Se comprueba una vez (el detalle se remonta por key).
  useEffect(() => {
    let alive = true;
    checkEmbeddable(site.url).then((r) => {
      if (alive) setEmbed(r?.ok && r.embeddable === false ? "blocked" : "ok");
    });
    return () => { alive = false; };
  }, [site.url]);

  useEffect(() => {
    if (view !== "meta" || doneFor.current === runId) return;
    doneFor.current = runId;
    let alive = true;
    analyzeSiteMeta(site.url).then((r) => {
      if (!alive) return;
      if (r?.ok) { setMeta(r); setMetaState("done"); }
      else { setMeta({ error: r?.error || "No se pudo analizar." }); setMetaState("error"); }
    });
    return () => { alive = false; };
  }, [view, site.url, runId]);

  // Tráfico (GA4): se pide la primera vez que se abre la pestaña.
  useEffect(() => {
    if (view !== "trafico" || askedTraffic.current) return;
    askedTraffic.current = true;
    let alive = true;
    fetchSiteTraffic(site.id).then((r) => {
      if (!alive) return;
      if (r?.ok) { setTraffic(r); setTrafficState("done"); }
      else { setTraffic({ error: r?.error || "No se pudo leer el tráfico." }); setTrafficState("error"); }
    });
    return () => { alive = false; };
  }, [view, site.id]);

  // Vuelve a lanzar el diagnóstico desde cero.
  const reanalyze = () => { setMeta(null); setMetaState("idle"); setRunId((n) => n + 1); };

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start">
      {/* Lienzo — web embebida o análisis de metadatos */}
      <Surface className="!p-0 overflow-hidden min-w-0">
        <div className="flex items-center gap-2 px-3 h-11 border-b border-border/70">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
          </span>
          <span className="ml-1 text-micro text-mutedSoft truncate flex-1">{hostOf(site.url)}</span>
          <div className="flex rounded-lg bg-surface2/70 p-0.5 text-[11.5px]">
            <button onClick={() => setView("web")} className={`px-2.5 py-1 rounded-md transition ${view === "web" ? "bg-paper text-ink shadow-sm" : "text-mutedSoft hover:text-ink"}`}>Web</button>
            <button onClick={() => setView("meta")} className={`px-2.5 py-1 rounded-md transition ${view === "meta" ? "bg-paper text-ink shadow-sm" : "text-mutedSoft hover:text-ink"}`}>Meta</button>
            <button onClick={() => setView("trafico")} className={`px-2.5 py-1 rounded-md transition ${view === "trafico" ? "bg-paper text-ink shadow-sm" : "text-mutedSoft hover:text-ink"}`}>Tráfico</button>
          </div>
          {view === "meta" && (
            <button
              onClick={reanalyze}
              disabled={metaState === "idle"}
              title="Volver a analizar"
              aria-label="Volver a analizar"
              className="h-7 w-7 grid place-items-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition disabled:opacity-40"
            >
              <svg className={cn("h-3.5 w-3.5", metaState === "idle" && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
            </button>
          )}
          <a href={site.url} target="_blank" rel="noreferrer" className="text-micro text-mutedSoft hover:text-ink transition px-1.5">Abrir ↗</a>
        </div>
        <div className="relative bg-paper" style={{ height: "calc(100vh - 12rem)" }}>
          {view === "trafico" ? (
            <div className="h-full overflow-y-auto">
              <TrafficPanel data={traffic} state={trafficState} tint={tint} />
            </div>
          ) : view === "meta" ? (
            <div className="h-full overflow-y-auto">
              <MetaPanel meta={meta} state={metaState} site={site} />
            </div>
          ) : embed === "blocked" ? (
            <div className="h-full grid place-items-center px-6 text-center">
              <div>
                <span className="mx-auto mb-4 h-12 w-12 grid place-items-center rounded-2xl bg-surface2 text-mutedSoft">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" /><circle cx="12" cy="12" r="10" /></svg>
                </span>
                <p className="text-body text-ink">Vista previa no disponible</p>
                <p className="text-micro text-mutedSoft mt-1 max-w-[30ch] mx-auto">Esta web no permite mostrarse aquí. Ábrela en una pestaña o consulta su Meta.</p>
                <a href={site.url} target="_blank" rel="noreferrer" className="btn-primary mt-5 inline-flex">Abrir la web ↗</a>
              </div>
            </div>
          ) : (
            <iframe
              key={site.id}
              src={site.url}
              title={site.title || hostOf(site.url)}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </Surface>

      {/* Ficha */}
      <aside key={site.id} className="slide-in mt-6 lg:mt-0 lg:sticky lg:top-8">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <SiteFavicon site={site} tint={tint} className="h-9 w-9 rounded-lg" />
            <div className="min-w-0">
              <h2 className="text-title text-ink leading-tight truncate">{site.title || hostOf(site.url)}</h2>
              <a href={site.url} target="_blank" rel="noreferrer" className="text-micro text-mutedSoft hover:text-ink transition truncate block">{hostOf(site.url)}</a>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {site.client && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium mb-3" style={{ backgroundColor: tint.bg, color: tint.fg }}>{site.client}</span>
        )}
        {site.description && <p className="text-small text-inkSoft leading-relaxed">{site.description}</p>}

        {site.tags?.length > 0 && (
          <div className="mt-4">
            <h3 className="section-eyebrow mb-2">Etiquetas</h3>
            <div className="flex flex-wrap gap-1.5">
              {site.tags.map((t) => <Badge key={t} kind="neutral">{t}</Badge>)}
            </div>
          </div>
        )}

        {site.repo_url && (
          <div className="mt-4">
            <h3 className="section-eyebrow mb-2">Repositorio</h3>
            <a
              href={site.repo_url}
              target="_blank"
              rel="noreferrer"
              title={site.repo_url}
              className="flex items-center gap-2 rounded-xl bg-surface2/50 px-3 py-2 text-small text-inkSoft hover:text-ink hover:bg-surface2/80 transition min-w-0"
            >
              <svg className="h-4 w-4 shrink-0 text-mutedSoft" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
              <span className="truncate flex-1">{repoLabel(site.repo_url)}</span>
              <span className="text-micro text-mutedSoft shrink-0">↗</span>
            </a>
          </div>
        )}

        <a href={site.url} target="_blank" rel="noreferrer" className="btn-primary w-full mt-6">Abrir la web ↗</a>
      </aside>
    </div>
  );
}

// ── Formulario de alta / edición (modal, solo admin) ─────────────────────────
const COLOR_OPTS = CLIENT_COLORS.map((c) => c.key);

function SiteForm({ site, clientNames, onClose, onSaved, onDeleted }) {
  const editing = Boolean(site?.id);
  const [form, setForm] = useState(() => ({
    url: site?.url || "",
    title: site?.title || "",
    description: site?.description || "",
    client: site?.client || "",
    color: site?.color || "",
    tags: (site?.tags || []).join(", "),
    image: site?.image || "",
    active: site?.active ?? true,
    ga_property_id: site?.ga_property_id || "",
    repo_url: site?.repo_url || "",
  }));
  const [msg, setMsg] = useState(null);
  const [busy, start] = useTransition();
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setMsg(null); };

  const traerMeta = async () => {
    if (!form.url.trim()) return;
    setLoadingMeta(true);
    const r = await fetchSiteMeta(form.url);
    setLoadingMeta(false);
    if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
    setForm((f) => ({
      ...f,
      url: r.url || f.url,
      title: f.title || r.title || "",
      description: f.description || r.description || "",
      image: f.image || r.image || "",
    }));
    setMsg({ ok: true, text: "Datos traídos de la web." });
  };

  const subirCaptura = async (file) => {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${Date.now()}-${Math.round(performance.now())}.${ext}`;
      const { error } = await supabase.storage.from("sites").upload(path, file, { upsert: false, contentType: file.type });
      if (error) { setMsg({ ok: false, text: `No se pudo subir: ${error.message}` }); return; }
      const { data } = supabase.storage.from("sites").getPublicUrl(path);
      setForm((f) => ({ ...f, image: data.publicUrl }));
    } finally {
      setUploading(false);
    }
  };

  const guardar = () => {
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      color: form.color || null,
      client: form.client.trim() || null,
      ga_property_id: form.ga_property_id.trim() || null,
      repo_url: form.repo_url.trim() || null,
    };
    start(async () => {
      const r = editing ? await updateSite(site.id, payload) : await createSite(payload);
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      onSaved(editing ? { ...site, ...payload } : r.site);
    });
  };

  const eliminar = () => {
    if (!editing) return;
    start(async () => {
      const r = await deleteSite(site.id);
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      onDeleted(site.id);
    });
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 bg-ink/30 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <Surface className="w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto !bg-paper shadow-float" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-title text-ink">{editing ? "Editar web" : "Añadir web"}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="h-7 w-7 inline-flex items-center justify-center rounded-md text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="grid gap-4">
          <Field label="URL">
            <div className="flex gap-2">
              <Input value={form.url} onChange={(e) => set("url")(e.target.value)} placeholder="tradinglab.es" className="flex-1" />
              <Button variant="ghost" size="sm" onClick={traerMeta} disabled={loadingMeta || !form.url.trim()}>
                {loadingMeta ? "Leyendo…" : "Traer datos"}
              </Button>
            </div>
          </Field>

          <Field label="Título"><Input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="Nombre de la web" /></Field>

          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              rows={3}
              placeholder="Para qué es, qué destaca…"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none transition focus:border-brand/55 focus:ring-2 focus:ring-brand/15 resize-none"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cliente asociado">
              <Input list="site-clients" value={form.client} onChange={(e) => set("client")(e.target.value)} placeholder="Opcional" />
              <datalist id="site-clients">{clientNames.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Color">
              <select value={form.color} onChange={(e) => set("color")(e.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-brand/55 focus:ring-2 focus:ring-brand/15">
                <option value="">Automático</option>
                {COLOR_OPTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Etiquetas" hint="Separadas por comas."><Input value={form.tags} onChange={(e) => set("tags")(e.target.value)} placeholder="landing, saas, evento" /></Field>

          <Field label="GA4 · ID de propiedad" hint="Solo el número (Administrar → Detalles de la propiedad). Alimenta la pestaña Tráfico.">
            <Input value={form.ga_property_id} onChange={(e) => set("ga_property_id")(e.target.value)} placeholder="123456789" inputMode="numeric" />
          </Field>

          <Field label="Repositorio (Git)" hint="URL del repo. Se muestra en la ficha de la web.">
            <Input value={form.repo_url} onChange={(e) => set("repo_url")(e.target.value)} placeholder="https://github.com/org/repo" />
          </Field>

          <Field label="Preview">
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-surface2 shrink-0 grid place-items-center">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image} alt="" className="h-full w-full object-cover" />
                ) : <span className="text-micro text-mutedSoft">Sin imagen</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => subirCaptura(e.target.files?.[0])} />
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? "Subiendo…" : "Subir captura"}
                </Button>
                {form.image && <button onClick={() => set("image")("")} className="text-micro text-mutedSoft hover:text-danger transition text-left">Quitar</button>}
              </div>
            </div>
          </Field>

          <label className="flex items-center gap-2.5 text-small text-inkSoft cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active")(e.target.checked)} className="h-4 w-4 rounded accent-ink" />
            Activa (visible en el escaparate)
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={guardar} disabled={busy || !form.url.trim()}>{busy ? "Guardando…" : editing ? "Guardar" : "Añadir"}</Button>
          {editing && <Button variant="danger" onClick={eliminar} disabled={busy}>Eliminar</Button>}
          {msg && <span className={`text-micro ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
        </div>
      </Surface>
    </div>,
    document.body
  );
}

// ── Pantalla ─────────────────────────────────────────────────────────────────
export default function SitesClient({ sites: initial, isAdmin }) {
  const [sites, setSites] = useState(initial);
  const [selId, setSelId] = useState(null);
  const [client, setClient] = useState(null);
  const [tag, setTag] = useState(null);
  const [form, setForm] = useState(null); // null | {} (nuevo) | site (editar)

  // El equipo solo ve las activas; administración las ve todas.
  const visibles = useMemo(() => (isAdmin ? sites : sites.filter((s) => s.active)), [sites, isAdmin]);
  const clientNames = useMemo(() => [...new Set(sites.map((s) => s.client).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")), [sites]);
  const tagNames = useMemo(() => [...new Set(visibles.flatMap((s) => s.tags || []))].sort((a, b) => a.localeCompare(b, "es")), [visibles]);

  const filtered = useMemo(
    () => visibles.filter((s) => (!client || s.client === client) && (!tag || (s.tags || []).includes(tag))),
    [visibles, client, tag]
  );
  const selected = sites.find((s) => s.id === selId) || null;

  const onSaved = (saved) => {
    setSites((list) => {
      const i = list.findIndex((s) => s.id === saved.id);
      return i >= 0 ? list.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)) : [saved, ...list];
    });
    setForm(null);
  };
  const onDeleted = (id) => {
    setSites((list) => list.filter((s) => s.id !== id));
    setForm(null);
    if (selId === id) setSelId(null);
  };

  // Filtros minimal (ghost, sin borde) para colgar en la cabecera.
  const filterCls = "!h-8 !border-transparent !bg-transparent !px-2.5 !text-[12.5px] !text-mutedSoft hover:!bg-surface2/70 data-[state=open]:!bg-surface2/70";

  // Cabecera común (formato Tareas): breadcrumb izq. + funciones a la derecha.
  const header = (
    <ScreenHeader
      kicker="Recursos"
      title="Websites"
      actions={
        <div className="flex items-center gap-1.5">
          {selected ? (
            <button onClick={() => setSelId(null)} className="h-8 px-3 grid place-items-center rounded-lg text-[12.5px] text-mutedSoft hover:text-ink hover:bg-surface2/60 transition">
              ← Todas
            </button>
          ) : (
            <>
              {clientNames.length > 0 && (
                <Select
                  value={client ?? "all"}
                  onChange={(v) => setClient(v === "all" ? null : v)}
                  ariaLabel="Filtrar por cliente"
                  className={filterCls}
                  options={[{ value: "all", label: "Todos los clientes" }, ...clientNames.map((c) => ({ value: c, label: c }))]}
                />
              )}
              {tagNames.length > 0 && (
                <Select
                  value={tag ?? "all"}
                  onChange={(v) => setTag(v === "all" ? null : v)}
                  ariaLabel="Filtrar por etiqueta"
                  className={filterCls}
                  options={[{ value: "all", label: "Todas las etiquetas" }, ...tagNames.map((t) => ({ value: t, label: t }))]}
                />
              )}
            </>
          )}
          {isAdmin && <Button size="sm" onClick={() => setForm(selected || {})}>{selected ? "Editar" : "Añadir web"}</Button>}
        </div>
      }
    />
  );

  const modal = form && (
    <SiteForm site={form} clientNames={clientNames} onClose={() => setForm(null)} onSaved={onSaved} onDeleted={onDeleted} />
  );

  if (selected) {
    return (
      <>
        {header}
        <SiteDetail key={selected.id} site={selected} onClose={() => setSelId(null)} />
        {modal}
      </>
    );
  }

  return (
    <>
      {header}

      {filtered.length === 0 ? (
        <EmptyState>{isAdmin ? "Aún no hay webs. Añade la primera con el botón de arriba." : "Administración todavía no ha publicado ninguna web."}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SiteCard key={s.id} site={s} active={s.id === selId} onOpen={() => setSelId(s.id)} />
          ))}
        </div>
      )}

      {modal}
    </>
  );
}
