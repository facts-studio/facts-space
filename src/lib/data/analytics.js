import "server-only";
import crypto from "crypto";

// Lectura de tráfico desde Google Analytics 4 (Data API v1beta), sin SDK: se
// firma un JWT de la cuenta de servicio con crypto y se piden los informes por
// REST. Credenciales en el servidor:
//   GA_CLIENT_EMAIL  — email de la cuenta de servicio
//   GA_PRIVATE_KEY   — su clave privada (los \n pueden venir escapados)
// Cada web guarda su propiedad en sites.ga_property_id (id numérico de GA4).

function getCreds() {
  const email = process.env.GA_CLIENT_EMAIL;
  let key = process.env.GA_PRIVATE_KEY;
  if (!email || !key) return null;
  key = key.replace(/\\n/g, "\n"); // en .env suele ir en una línea con \n escapados
  return { email, key };
}

export function isAnalyticsConfigured() {
  return Boolean(getCreds());
}

const b64url = (s) => Buffer.from(s).toString("base64url");

// Token de acceso OAuth2 (JWT bearer) cacheado en memoria mientras vive.
let tokenCache = null; // { token, exp }
async function accessToken() {
  const c = getCreds();
  if (!c) return null;
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) return tokenCache.token;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: c.email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  let jwt;
  try {
    const sig = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${claim}`), c.key);
    jwt = `${header}.${claim}.${sig.toString("base64url")}`;
  } catch {
    return null; // clave privada mal formada
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = await res.json();
  tokenCache = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return tokenCache.token;
}

async function runReport(token, propertyId, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GA ${res.status}`);
  return res.json();
}

// Tráfico de una propiedad GA4 en los últimos `days` días: KPIs (usuarios,
// sesiones, páginas vistas) + serie diaria para el gráfico.
// Devuelve null si no está configurado; { ok:false, error } si la API falla.
export async function getSiteTraffic(propertyId, { days = 30 } = {}) {
  if (!propertyId || !isAnalyticsConfigured()) return null;
  const token = await accessToken();
  if (!token) return { ok: false, error: "No se pudo autenticar con Google." };

  const range = { startDate: `${days}daysAgo`, endDate: "today" };
  try {
    const [totals, serie] = await Promise.all([
      // KPIs: usuarios ÚNICOS reales (sin dimensión de fecha, para no sumar días).
      runReport(token, propertyId, {
        dateRanges: [range],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
      }),
      // Serie diaria (sesiones) para el gráfico.
      runReport(token, propertyId, {
        dateRanges: [range],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: 400,
      }),
    ]);

    const tv = totals.rows?.[0]?.metricValues || [];
    const num = (i) => Number(tv[i]?.value) || 0;
    const series = (serie.rows || []).map((r) => {
      const d = r.dimensionValues?.[0]?.value || ""; // YYYYMMDD
      const iso = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
      return { date: iso, sessions: Number(r.metricValues?.[0]?.value) || 0, users: Number(r.metricValues?.[1]?.value) || 0 };
    });

    return { ok: true, days, users: num(0), sessions: num(1), views: num(2), series };
  } catch (e) {
    return { ok: false, error: e.message || "No se pudo leer GA4." };
  }
}
