"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getSiteTraffic, isAnalyticsConfigured } from "@/lib/data/analytics";

// Campos que administración puede escribir de una web. `image` se guarda como
// URL (og:image de la propia web o una captura subida al bucket `sites`).
// `ga_property_id` = id numérico de la propiedad GA4 para el análisis de tráfico.
const WRITABLE = ["url", "title", "description", "client", "color", "tags", "image", "active", "position", "ga_property_id"];

function pick(fields) {
  const patch = {};
  for (const key of WRITABLE) {
    if (!(key in fields)) continue;
    const raw = fields[key];
    patch[key] = typeof raw === "string" ? raw.trim() : raw;
  }
  return patch;
}

// Normaliza una URL suelta ("tradinglab.es") a algo con esquema.
function normalizeUrl(url) {
  const s = (url || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

// Solo administración escribe. Devuelve {db, me} o un error listo para responder.
async function adminDb() {
  const me = await getCurrentEmployee();
  if (!me) return { error: "No hay sesión activa." };
  if (!me.is_admin) return { error: "Solo administración puede editar las webs." };
  const db = createAdminClient();
  if (!db) return { error: "Falta la configuración del servidor." };
  return { db, me };
}

/**
 * Lee los metadatos Open Graph de una URL para autorrellenar el alta: título,
 * imagen de preview y descripción. Best-effort: si la web no responde o no trae
 * OG tags, devuelve lo que haya (y el admin lo completa a mano).
 */
export async function fetchSiteMeta(url) {
  const target = normalizeUrl(url);
  if (!target) return { ok: false, error: "URL vacía." };
  try {
    const res = await fetch(target, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FctsPortal/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `La web respondió ${res.status}.` };
    const html = (await res.text()).slice(0, 500_000); // suficiente para el <head>

    const meta = (prop) => {
      // Soporta property="og:x" y name="x", en cualquier orden de atributos.
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
        "i"
      );
      const alt = new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
        "i"
      );
      return (html.match(re)?.[1] || html.match(alt)?.[1] || "").trim();
    };
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "";
    let image = meta("og:image") || meta("twitter:image");
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, target).href; } catch { image = ""; }
    }
    return {
      ok: true,
      url: target,
      title: meta("og:title") || titleTag,
      description: meta("og:description") || meta("description"),
      image,
    };
  } catch (e) {
    return { ok: false, error: e?.name === "TimeoutError" ? "La web tardó demasiado en responder." : "No se pudieron leer los datos de la web." };
  }
}

/**
 * Análisis de metadatos de una web para la pestaña "Meta": cómo se ve al
 * compartir (Open Graph), los iconos (favicon + apple-touch / instalación) y un
 * repaso SEO básico. Best-effort y de solo lectura (no toca la base).
 */
export async function analyzeSiteMeta(url) {
  const target = normalizeUrl(url);
  if (!target) return { ok: false, error: "URL vacía." };

  const UA = { "User-Agent": "Mozilla/5.0 (compatible; FctsPortal/1.0)" };
  // ¿Carga un recurso como imagen? Devuelve { ok, ct } sin descargar entero.
  const imgStatus = async (u) => {
    if (!u) return null;
    try {
      const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(7000) });
      const ct = (r.headers.get("content-type") || "").split(";")[0];
      return { ok: r.ok && ct.startsWith("image/"), status: r.status, ct };
    } catch { return { ok: false, status: 0, ct: null }; }
  };

  try {
    const res = await fetch(target, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(9000) });
    if (!res.ok) return { ok: false, error: `La web respondió ${res.status}.` };
    const html = (await res.text()).slice(0, 600_000);

    const abs = (href) => { try { return new URL(href, target).href; } catch { return null; } };
    const meta = (prop) => {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
      const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
      return (html.match(re)?.[1] || html.match(alt)?.[1] || "").trim();
    };
    const linkHref = (relTest) => {
      for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
        const tag = m[0];
        const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1] || "";
        if (relTest.test(rel)) { const h = tag.match(/href=["']([^"']+)["']/i)?.[1]; if (h) return abs(h); }
      }
      return null;
    };

    const titleTag = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "").trim();
    const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] || "";
    const canonical = linkHref(/canonical/i);
    const charset = (html.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] || "").toUpperCase();
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    let ogImage = meta("og:image") || meta("twitter:image");
    ogImage = ogImage ? abs(ogImage) : "";
    const favicon = linkHref(/(^|\s)(shortcut\s+)?icon($|\s)/i) || abs("/favicon.ico");
    const appleIcon = linkHref(/apple-touch-icon/i);

    // Tipos de datos estructurados (JSON-LD): Organization, FAQPage, Article…
    // Señal fuerte para GEO (que las IAs entiendan qué es cada cosa).
    const jsonLdTypes = new Set();
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const collect = (o) => {
          if (!o || typeof o !== "object") return;
          if (Array.isArray(o)) return o.forEach(collect);
          if (o["@type"]) [].concat(o["@type"]).forEach((t) => jsonLdTypes.add(String(t)));
          if (o["@graph"]) collect(o["@graph"]);
        };
        collect(JSON.parse(m[1].trim()));
      } catch { /* JSON-LD malformado: se ignora */ }
    }
    const hasJsonLd = jsonLdTypes.size > 0 || /<script[^>]+type=["']application\/ld\+json["']/i.test(html);

    // Recursos de raíz para GEO: llms.txt (guía para modelos) y robots.txt (¿deja
    // pasar a los bots de IA?). Best-effort desde el origen.
    const origin = (() => { try { return new URL(target).origin; } catch { return null; } })();
    const fetchText = async (path) => {
      if (!origin) return null;
      try {
        const r = await fetch(origin + path, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(6000) });
        if (!r.ok) return null;
        return { ct: (r.headers.get("content-type") || "").toLowerCase(), body: (await r.text()).slice(0, 60_000) };
      } catch { return null; }
    };

    const [ogImageStatus, faviconStatus, appleStatus, llmsRes, robotsRes] = await Promise.all([
      imgStatus(ogImage), imgStatus(favicon), imgStatus(appleIcon), fetchText("/llms.txt"), fetchText("/robots.txt"),
    ]);

    // llms.txt válido = existe y NO es el HTML de la SPA devuelto para todo path.
    const llmsOk = Boolean(
      llmsRes && llmsRes.body.trim() && !/^\s*<(!doctype|html)/i.test(llmsRes.body) &&
      (llmsRes.ct.includes("text/plain") || llmsRes.ct.includes("markdown") || /^\s*#/.test(llmsRes.body))
    );

    // robots.txt: ¿bloquea a los bots de IA? Se marca uno como bloqueado si su
    // grupo (o el comodín *) lleva "Disallow: /".
    const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "anthropic-ai"];
    let robotsInfo = { present: false, blocked: [] };
    if (robotsRes && /user-agent/i.test(robotsRes.body)) {
      const groups = []; let cur = null;
      for (const raw of robotsRes.body.split(/\r?\n/)) {
        const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
        const mm = line.match(/^([\w-]+)\s*:\s*(.*)$/); if (!mm) continue;
        const key = mm[1].toLowerCase(); const val = mm[2].trim();
        if (key === "user-agent") { if (!cur || cur.hasRules) { cur = { agents: [], dis: [], hasRules: false }; groups.push(cur); } cur.agents.push(val.toLowerCase()); }
        else if (cur && (key === "disallow" || key === "allow")) { cur.hasRules = true; if (key === "disallow") cur.dis.push(val); }
      }
      const blocksRoot = (bot) => {
        const g = groups.find((x) => x.agents.includes(bot.toLowerCase())) || groups.find((x) => x.agents.includes("*"));
        return g ? g.dis.some((d) => d.trim() === "/") : false;
      };
      robotsInfo = { present: true, blocked: AI_BOTS.filter(blocksRoot) };
    }

    const host = (() => { try { return new URL(target).hostname.replace(/^www\./, ""); } catch { return target; } })();

    return {
      ok: true,
      url: target,
      host,
      title: titleTag,
      description: meta("description"),
      canonical,
      lang,
      viewport: meta("viewport"),
      themeColor: meta("theme-color"),
      robots: meta("robots"),
      charset,
      hasJsonLd,
      jsonLdTypes: [...jsonLdTypes],
      h1Count,
      geo: {
        llms: llmsOk,
        robots: robotsInfo, // { present, blocked: [bots] }
        faq: [...jsonLdTypes].some((t) => /faq/i.test(t)),
      },
      og: {
        title: meta("og:title"),
        description: meta("og:description"),
        image: ogImage,
        imageStatus: ogImageStatus,
        type: meta("og:type"),
        siteName: meta("og:site_name"),
      },
      twitter: { card: meta("twitter:card"), title: meta("twitter:title"), image: (() => { const t = meta("twitter:image"); return t ? abs(t) : ""; })() },
      favicon: { href: favicon, status: faviconStatus },
      appleIcon: { href: appleIcon, status: appleStatus },
      // Servicio de Google como respaldo del favicon (lo que ve el portal).
      googleFavicon: `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    };
  } catch (e) {
    return { ok: false, error: e?.name === "TimeoutError" ? "La web tardó demasiado en responder." : "No se pudo leer la web." };
  }
}

/**
 * ¿Se puede embeber la web en un iframe? Muchas landings mandan cabeceras que lo
 * bloquean (X-Frame-Options: DENY/SAMEORIGIN, o CSP frame-ancestors sin '*'),
 * y el iframe saldría en blanco. Se lee desde el servidor (las cabeceras llegan
 * igual aunque bloqueen al navegador). Si no se puede comprobar, se deja intentar.
 */
export async function checkEmbeddable(url) {
  const target = normalizeUrl(url);
  if (!target) return { ok: false };
  try {
    const r = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FctsPortal/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    const xfo = (r.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (r.headers.get("content-security-policy") || "").toLowerCase();
    let blocked = xfo.includes("deny") || xfo.includes("sameorigin");
    const fa = csp.match(/frame-ancestors([^;]*)/);
    if (fa && !fa[1].includes("*")) blocked = true; // 'none' / 'self' / dominios → nos bloquea
    return { ok: true, embeddable: !blocked };
  } catch {
    return { ok: false }; // no se pudo comprobar → que lo intente el iframe
  }
}

/**
 * Tráfico de una web (GA4) para la pestaña "Tráfico": KPIs + serie de 30 días.
 * Requiere sesión (lo ve el equipo, no solo admin) y que la web tenga
 * ga_property_id. Best-effort: devuelve {ok:false, error} legible si algo falla.
 */
export async function fetchSiteTraffic(id) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No hay sesión activa." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  if (!isAnalyticsConfigured()) return { ok: false, error: "Analytics no está configurado en el servidor." };

  const db = createAdminClient();
  if (!db) return { ok: false, error: "Falta la configuración del servidor." };
  const { data: site } = await db.from("sites").select("ga_property_id").eq("id", id).single();
  if (!site?.ga_property_id) return { ok: false, error: "Esta web aún no tiene una propiedad de GA4 vinculada." };

  const r = await getSiteTraffic(site.ga_property_id, { days: 30 });
  if (!r || !r.ok) return { ok: false, error: r?.error || "No se pudo leer GA4." };
  return { ok: true, ...r };
}

export async function createSite(fields = {}) {
  const { db, me, error } = await adminDb();
  if (error) return { ok: false, error };

  const patch = pick(fields);
  patch.url = normalizeUrl(patch.url);
  if (!patch.url) return { ok: false, error: "Hace falta una URL." };
  patch.created_by = me.id;

  const { data, error: dbErr } = await db.from("sites").insert(patch).select().single();
  if (dbErr) return { ok: false, error: dbErr.message };
  revalidatePath("/recursos/websites");
  return { ok: true, site: data };
}

export async function updateSite(id, fields = {}) {
  const { db, error } = await adminDb();
  if (error) return { ok: false, error };
  if (!id) return { ok: false, error: "Falta el identificador." };

  const patch = pick(fields);
  if ("url" in patch) patch.url = normalizeUrl(patch.url);
  patch.updated_at = new Date().toISOString();

  const { error: dbErr } = await db.from("sites").update(patch).eq("id", id);
  if (dbErr) return { ok: false, error: dbErr.message };
  revalidatePath("/recursos/websites");
  return { ok: true };
}

export async function deleteSite(id) {
  const { db, error } = await adminDb();
  if (error) return { ok: false, error };
  if (!id) return { ok: false, error: "Falta el identificador." };

  const { error: dbErr } = await db.from("sites").delete().eq("id", id);
  if (dbErr) return { ok: false, error: dbErr.message };
  revalidatePath("/recursos/websites");
  return { ok: true };
}
