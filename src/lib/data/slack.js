import "server-only";

// ── Tickets de Slack (Slack Lists) ───────────────────────────────────────────
// Los departamentos reciben peticiones como items de una List alimentada por el
// flujo "Nuevo Ticket" de los canales compartidos. Aquí los leemos para mostrar
// su estado en Inicio. Sin configuración devolvemos vacío y el módulo no sale.
//
// Config (.env.local y Vercel):
//   SLACK_BOT_TOKEN=xoxb-…                 app con scopes lists:read, files:read, users:read
//   SLACK_TICKET_LIST=F0AADK2GD3N          id de la lista de tickets
//   SLACK_TEAM_ID=T…                       para enlazar al ticket concreto
//   SLACK_TICKET_CHANNELS=C09…:Creative,C08…:Tech   (opcional) nombre por canal
//
// La lista no expone su esquema en los items: las celdas vienen con ids de
// columna y de opción, así que primero pedimos files.info para saber cómo se
// llama cada columna y qué significa cada Opt….
const BASE = "https://slack.com/api";

export function isSlackConfigured() {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_TICKET_LIST);
}

async function call(method, params) {
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: new URLSearchParams(params),
    next: { revalidate: 60 }, // el tablero se mueve, pero no cada segundo
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.ok ? json : null;
}

const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Nombre de columna → papel que juega en el ticket. El título es la columna
// nativa de la lista (key "name"), así que ese no hace falta nombrarlo.
const ROLES = {
  detail: ["detalles", "descripcion"],
  status: ["estado"],
  assignee: ["responsable", "asignado"],
  author: ["enviado por", "solicitante"],
  channel: ["canal"],
  blocked: ["motivo de bloqueado", "motivo"],
};

async function listSchema(listId) {
  const info = await call("files.info", { file: listId });
  const columns = info?.file?.list_metadata?.schema ?? [];
  const roles = {};
  const options = {};
  for (const col of columns) {
    const name = norm(col.name);
    for (const [role, aliases] of Object.entries(ROLES)) {
      if (!roles[role] && aliases.some((a) => name.includes(a))) roles[role] = col.id;
    }
    for (const opt of col.options?.choices ?? []) options[opt.value] = opt.label;
  }
  return { roles, options };
}

// Los ids de persona se traducen con el directorio del workspace. Los invitados
// de Slack Connect (clientes) no salen ahí, así que los pedimos uno a uno.
async function directory(ids) {
  const all = await call("users.list", { limit: "200" });
  const names = new Map((all?.members ?? []).map((m) => [m.id, m.profile?.real_name || m.name]));
  const missing = [...ids].filter((id) => id && !names.has(id));
  const extra = await Promise.all(missing.map((id) => call("users.info", { user: id })));
  extra.forEach((r, i) => {
    const u = r?.user;
    if (u) names.set(missing[i], u.profile?.real_name || u.name);
  });
  return names;
}

function channelLabels() {
  return Object.fromEntries(
    (process.env.SLACK_TICKET_CHANNELS || "")
      .split(",")
      .map((p) => p.trim().split(":").map((x) => x.trim()))
      .filter(([id, label]) => id && label)
  );
}

// Directorio del workspace, para el selector de Admin (mismo papel que los
// grupos de ClickUp). Solo personas reales: fuera bots, apps y desactivados.
export async function getSlackUsers() {
  if (!process.env.SLACK_BOT_TOKEN) return [];
  try {
    const res = await call("users.list", { limit: "200" });
    return (res?.members ?? [])
      .filter((m) => !m.is_bot && !m.deleted && m.id !== "USLACKBOT")
      .map((m) => ({
        id: m.id,
        name: m.profile?.real_name || m.name,
        email: m.profile?.email ?? null,
        // Los invitados de Slack Connect son gente de cliente: conviene verlo.
        guest: Boolean(m.is_restricted || m.is_ultra_restricted),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  } catch {
    return [];
  }
}

// Todos los tickets de la lista. Nunca lanza: si Slack falla, el resto de Inicio
// no se cae por ello.
export async function getSlackTickets() {
  if (!isSlackConfigured()) return [];
  try {
    const listId = process.env.SLACK_TICKET_LIST;
    const [schema, items] = await Promise.all([
      listSchema(listId),
      call("slackLists.items.list", { list_id: listId, limit: "200", archived: "false" }),
    ]);
    if (!items) return [];
    const { roles, options } = schema;

    const cell = (it, role) => (roles[role] ? it.fields.find((f) => f.column_id === roles[role]) : null);
    const people = new Set();
    for (const it of items.items ?? []) {
      for (const role of ["assignee", "author"]) people.add(cell(it, role)?.user?.[0]);
    }
    const names = await directory(people);
    const labels = channelLabels();
    // Enlace a la lista en el workspace. Slack no documenta un permalink por
    // item, así que apuntamos a la lista: abre y desde ahí se ve el ticket.
    const team = process.env.SLACK_TEAM_ID;
    const workspace = (process.env.SLACK_WORKSPACE_URL || "https://slack.com").replace(/\/$/, "");
    const listUrl = team ? `${workspace}/lists/${team}/${listId}` : `${workspace}/lists/${listId}`;

    const soloConfigurados = Object.keys(labels).length > 0;
    return (items.items ?? []).map((it) => {
      const title = it.fields.find((f) => f.key === "name");
      const personId = (role) => cell(it, role)?.user?.[0] ?? null;
      const person = (role) => {
        const id = personId(role);
        return id ? names.get(id) ?? null : null;
      };
      const channelId = options[cell(it, "channel")?.select?.[0]] ?? null;
      return {
        id: it.id,
        title: title?.text?.trim() || "Ticket sin título",
        detail: cell(it, "detail")?.text?.trim() || null,
        status: options[cell(it, "status")?.select?.[0]] ?? null,
        blockedReason: cell(it, "blocked")?.text?.trim() || null,
        assignee: person("assignee"),
        // El id permite saber si el ticket es tuyo (employees.slack_user_id).
        assigneeId: personId("assignee"),
        author: person("author"),
        channel: channelId,
        list: labels[channelId] ?? null,
        createdAt: it.date_created ? Number(it.date_created) * 1000 : null,
        url: listUrl,
      };
    })
    // Si hay canales configurados, el resto no nos incumbe (p. ej. los de tech).
    .filter((t) => !soloConfigurados || (t.channel && labels[t.channel]));
  } catch {
    return [];
  }
}

