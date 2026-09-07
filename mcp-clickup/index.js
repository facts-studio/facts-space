#!/usr/bin/env node
// MCP server: conecta Claude con el ClickUp de F*cts Studio.
//
// No pasa por el portal: lee la MISMA configuración que él (`clickup_lists` en
// Supabase) y la API de ClickUp. Así el asistente ve lo que ve la pantalla de
// Tareas —incluida la visibilidad— sin duplicar reglas ni depender de que el
// servidor de Next esté levantado.

// Sin dependencias a propósito. El SDK oficial declara sus exports con
// comodines (`./*`), y este repositorio vive en una carpeta que lleva un `*` en
// el nombre ("F*cts Space"): Node mezcla ambos al resolver y no encuentra nada.
// El protocolo por stdio son cuatro mensajes JSON-RPC, así que sale más barato
// hablarlo directamente que pelearse con la resolución.

const CU = "https://api.clickup.com/api/v2";
const TOKEN = process.env.CLICKUP_API_TOKEN || "";
const TEAM = process.env.CLICKUP_TEAM_ID || "";
const SB_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!TOKEN || !TEAM) {
  console.error("[mcp-clickup] CLICKUP_API_TOKEN y CLICKUP_TEAM_ID son requeridos");
  process.exit(1);
}

const DAY = 86400000;
const hoy = () => new Date().setHours(0, 0, 0, 0);
const iso = (ms) => (ms ? new Date(Number(ms)).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" }) : null);
const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

async function clickup(path, { method = "GET", body } = {}) {
  const res = await fetch(`${CU}${path}`, {
    method,
    headers: { Authorization: TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ClickUp ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// Configuración de listas del portal. Es la fuente de "qué proyectos existen"
// y de quién puede verlos; sin Supabase se trabaja contra el workspace entero.
async function listasConfiguradas() {
  if (!SB_URL || !SB_KEY) return [];
  const res = await fetch(
    `${SB_URL}/rest/v1/clickup_lists?select=list_id,list_name,folder_name,space_name,visible,admin_only,is_sprint,is_campaign,list_start,list_due,list_content&order=folder_name`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

// Misma regla que src/lib/data/clickup.js: activada, no bloqueada y "Management"
// nunca. Si el portal la esconde, el asistente tampoco la cuenta.
const visible = (l) =>
  l.visible && !l.admin_only && norm(l.list_name) !== "management";

async function listasVisibles() {
  return (await listasConfiguradas()).filter(visible);
}

async function buscarLista(referencia) {
  const listas = await listasVisibles();
  const q = norm(referencia);
  return (
    listas.find((l) => String(l.list_id) === String(referencia)) ||
    listas.find((l) => norm(l.list_name) === q) ||
    listas.find((l) => norm(l.list_name).includes(q)) ||
    listas.find((l) => norm(l.folder_name) === q) ||
    null
  );
}

const abierta = (t) => !["done", "closed"].includes(t.status?.type);

function tareaResumen(t) {
  return {
    id: t.id,
    nombre: t.name,
    estado: t.status?.status ?? null,
    abierta: abierta(t),
    hito: t.custom_item_id === 1,
    lista: t.list?.name ?? null,
    cliente: t.folder?.hidden ? null : t.folder?.name ?? null,
    inicio: iso(t.start_date),
    entrega: iso(t.due_date),
    vencida: Boolean(t.due_date && Number(t.due_date) < hoy() && abierta(t)),
    // En ClickUp casi todo se asigna a grupos ("Equipo:Nombre"), no a usuarios.
    asignados: [
      ...(t.group_assignees ?? []).map((g) => g.name),
      ...(t.assignees ?? []).map((a) => a.username || a.email),
    ].filter(Boolean),
    url: t.url ?? null,
  };
}

async function tareasDeLista(listId, { cerradas = false } = {}) {
  const out = [];
  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams({
      page: String(page),
      subtasks: "true",
      include_closed: cerradas ? "true" : "false",
    });
    const j = await clickup(`/list/${listId}/task?${qs}`);
    const lote = j?.tasks ?? [];
    out.push(...lote);
    if (lote.length < 100) break;
  }
  return out;
}

// ───── Tools ─────

const tools = [
  {
    name: "list_proyectos",
    description:
      "Proyectos del estudio: cada cliente con sus listas de ClickUp, sus fechas y si es un sprint o un proyecto temporal. Es el mapa del que salen los demás datos — empieza por aquí si no sabes el nombre exacto de una lista.",
    inputSchema: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Filtra por cliente (carpeta de ClickUp)." },
        solo_activos: { type: "boolean", description: "Solo sprints y proyectos temporales en curso." },
      },
    },
    run: async ({ cliente, solo_activos }) => {
      let listas = await listasVisibles();
      if (cliente) listas = listas.filter((l) => norm(l.folder_name).includes(norm(cliente)));
      if (solo_activos) {
        const t = hoy();
        listas = listas.filter(
          (l) => (l.is_sprint || l.is_campaign) && (!l.list_due || new Date(l.list_due).getTime() >= t)
        );
      }
      return listas.map((l) => ({
        list_id: l.list_id,
        lista: l.list_name,
        cliente: l.folder_name,
        rama: l.space_name,
        tipo: l.is_sprint ? "sprint" : l.is_campaign ? "proyecto temporal" : "lista fija",
        inicio: l.list_start ? new Date(l.list_start).toLocaleDateString("es-ES") : null,
        fin: l.list_due ? new Date(l.list_due).toLocaleDateString("es-ES") : null,
        definicion: (l.list_content || "").trim() || null,
      }));
    },
  },
  {
    name: "resumen_proyecto",
    description:
      "Cuántas tareas tiene un proyecto y cómo va: activas, vencidas, hechas, y sus fechas de inicio y entrega. Úsalo para «cuántas tareas activas tiene X» o «cuándo termina X».",
    inputSchema: {
      type: "object",
      required: ["proyecto"],
      properties: {
        proyecto: { type: "string", description: "Nombre de la lista, del cliente, o list_id." },
      },
    },
    run: async ({ proyecto }) => {
      const l = await buscarLista(proyecto);
      if (!l) return { error: `No encuentro ningún proyecto visible que se parezca a "${proyecto}".` };
      const tareas = await tareasDeLista(l.list_id, { cerradas: true });
      const abiertas = tareas.filter(abierta);
      const t = hoy();
      return {
        proyecto: l.list_name,
        cliente: l.folder_name,
        tipo: l.is_sprint ? "sprint" : l.is_campaign ? "proyecto temporal" : "lista fija",
        inicio: l.list_start ? new Date(l.list_start).toLocaleDateString("es-ES") : null,
        entrega: l.list_due ? new Date(l.list_due).toLocaleDateString("es-ES") : null,
        dias_para_la_entrega: l.list_due
          ? Math.round((new Date(l.list_due).setHours(0, 0, 0, 0) - t) / DAY)
          : null,
        total: tareas.length,
        activas: abiertas.length,
        hechas: tareas.length - abiertas.length,
        vencidas: abiertas.filter((x) => x.due_date && Number(x.due_date) < t).length,
        sin_fecha: abiertas.filter((x) => !x.due_date).length,
      };
    },
  },
  {
    name: "list_tareas",
    description:
      "Tareas de un proyecto (o de todo el portal si no se indica). Por defecto solo las abiertas. Devuelve estado, fechas, asignados y vencimiento.",
    inputSchema: {
      type: "object",
      properties: {
        proyecto: { type: "string", description: "Nombre de la lista, del cliente, o list_id." },
        persona: { type: "string", description: "Filtra por asignado (nombre del grupo de ClickUp)." },
        solo_vencidas: { type: "boolean" },
        incluir_cerradas: { type: "boolean" },
        limite: { type: "number", description: "Máximo de tareas a devolver (50 por defecto)." },
      },
    },
    run: async ({ proyecto, persona, solo_vencidas, incluir_cerradas, limite }) => {
      const listas = proyecto ? [await buscarLista(proyecto)].filter(Boolean) : await listasVisibles();
      if (!listas.length) return { error: `No encuentro ningún proyecto visible que se parezca a "${proyecto}".` };
      const crudas = (
        await Promise.all(listas.map((l) => tareasDeLista(l.list_id, { cerradas: incluir_cerradas })))
      ).flat();
      let tareas = crudas.map(tareaResumen);
      if (persona) tareas = tareas.filter((t) => t.asignados.some((a) => norm(a).includes(norm(persona))));
      if (solo_vencidas) tareas = tareas.filter((t) => t.vencida);
      tareas.sort((a, b) => (a.entrega ? 0 : 1) - (b.entrega ? 0 : 1));
      const tope = Number(limite) > 0 ? Number(limite) : 50;
      return { total: tareas.length, mostradas: Math.min(tope, tareas.length), tareas: tareas.slice(0, tope) };
    },
  },
  {
    name: "get_tarea",
    description:
      "Detalle de una tarea: estado, fechas, asignados, descripción y enlace. Acepta el id de ClickUp o un trozo del nombre.",
    inputSchema: {
      type: "object",
      required: ["tarea"],
      properties: {
        tarea: { type: "string", description: "id de ClickUp o parte del nombre." },
        proyecto: { type: "string", description: "Acota la búsqueda por nombre a un proyecto." },
      },
    },
    run: async ({ tarea, proyecto }) => {
      // Un id de ClickUp no lleva espacios: si lo parece, se pide directo.
      if (!/\s/.test(tarea)) {
        try {
          const t = await clickup(`/task/${encodeURIComponent(tarea)}`);
          return { ...tareaResumen(t), descripcion: (t.text_content || t.description || "").trim() || null };
        } catch { /* no era un id: se busca por nombre */ }
      }
      const listas = proyecto ? [await buscarLista(proyecto)].filter(Boolean) : await listasVisibles();
      const crudas = (
        await Promise.all(listas.map((l) => tareasDeLista(l.list_id, { cerradas: true })))
      ).flat();
      const q = norm(tarea);
      const hallazgos = crudas.filter((t) => norm(t.name).includes(q));
      if (!hallazgos.length) return { error: `No encuentro ninguna tarea que se parezca a "${tarea}".` };
      if (hallazgos.length > 1) {
        return {
          aviso: "Hay varias que encajan: dime cuál.",
          candidatas: hallazgos.slice(0, 8).map(tareaResumen),
        };
      }
      const t = hallazgos[0];
      return { ...tareaResumen(t), descripcion: (t.text_content || t.description || "").trim() || null };
    },
  },
  {
    name: "list_estados",
    description:
      "Estados posibles de un proyecto. Consúltalo ANTES de cambiar el estado de una tarea: los nombres varían de una lista a otra.",
    inputSchema: {
      type: "object",
      required: ["proyecto"],
      properties: { proyecto: { type: "string", description: "Nombre de la lista, del cliente, o list_id." } },
    },
    run: async ({ proyecto }) => {
      const l = await buscarLista(proyecto);
      if (!l) return { error: `No encuentro ningún proyecto visible que se parezca a "${proyecto}".` };
      const j = await clickup(`/list/${l.list_id}`);
      return {
        proyecto: l.list_name,
        estados: (j?.statuses ?? []).map((s) => ({ estado: s.status, tipo: s.type })),
      };
    },
  },
  {
    name: "set_estado_tarea",
    description:
      "Cambia el estado de una tarea en ClickUp. El estado tiene que ser uno de los que devuelve list_estados para ese proyecto. Escribe en ClickUp de verdad: confírmalo con la persona antes de usarlo.",
    inputSchema: {
      type: "object",
      required: ["task_id", "estado"],
      properties: {
        task_id: { type: "string", description: "id de ClickUp (el que devuelve get_tarea)." },
        estado: { type: "string", description: "Nombre exacto del estado." },
      },
    },
    run: async ({ task_id, estado }) => {
      await clickup(`/task/${encodeURIComponent(task_id)}`, { method: "PUT", body: { status: estado } });
      const t = await clickup(`/task/${encodeURIComponent(task_id)}`);
      return { ok: true, tarea: t.name, estado: t.status?.status ?? estado };
    },
  },
  {
    name: "list_hitos",
    description:
      "Hitos y entregas con fecha: los milestones de ClickUp más el inicio y el fin de cada sprint. Úsalo para «para cuándo era la entrega de X».",
    inputSchema: {
      type: "object",
      properties: {
        proyecto: { type: "string", description: "Acota a un proyecto o cliente." },
        desde_hoy: { type: "boolean", description: "Solo los que quedan por delante." },
      },
    },
    run: async ({ proyecto, desde_hoy }) => {
      let listas = await listasVisibles();
      if (proyecto) {
        const q = norm(proyecto);
        listas = listas.filter((l) => norm(l.list_name).includes(q) || norm(l.folder_name).includes(q));
      }
      const t = hoy();
      const out = [];
      for (const l of listas) {
        if (l.list_start) out.push({ tipo: "inicio de sprint", proyecto: l.list_name, cliente: l.folder_name, fecha: new Date(l.list_start).toLocaleDateString("es-ES"), ts: new Date(l.list_start).getTime() });
        if (l.list_due) out.push({ tipo: "fin de sprint", proyecto: l.list_name, cliente: l.folder_name, fecha: new Date(l.list_due).toLocaleDateString("es-ES"), ts: new Date(l.list_due).getTime() });
      }
      const crudas = (await Promise.all(listas.map((l) => tareasDeLista(l.list_id, { cerradas: true })))).flat();
      for (const x of crudas) {
        if (x.custom_item_id !== 1 || !x.due_date) continue;
        out.push({ tipo: "hito", proyecto: x.list?.name ?? null, cliente: x.folder?.name ?? null, nombre: x.name, fecha: iso(x.due_date), ts: Number(x.due_date), estado: x.status?.status ?? null });
      }
      return out
        .filter((h) => !desde_hoy || h.ts >= t)
        .sort((a, b) => a.ts - b.ts)
        .map(({ ts, ...resto }) => resto);
    },
  },
];

// ───── Servidor MCP (JSON-RPC por stdio, mensajes separados por salto) ─────

const PROTOCOLO = "2024-11-05";

function responder(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function fallar(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

async function atender(msg) {
  const { id, method, params } = msg;
  // Las notificaciones (sin id) no llevan respuesta.
  if (id === undefined || id === null) return;

  if (method === "initialize") {
    return responder(id, {
      protocolVersion: PROTOCOLO,
      capabilities: { tools: {} },
      serverInfo: { name: "mcp-clickup", version: "0.1.0" },
    });
  }
  if (method === "ping") return responder(id, {});
  if (method === "tools/list") {
    return responder(id, {
      tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    });
  }
  if (method === "tools/call") {
    const tool = tools.find((t) => t.name === params?.name);
    if (!tool) return fallar(id, -32602, `Unknown tool: ${params?.name}`);
    try {
      const result = await tool.run(params.arguments || {});
      const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      return responder(id, { content: [{ type: "text", text }] });
    } catch (e) {
      return responder(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
    }
  }
  return fallar(id, -32601, `Method not found: ${method}`);
}

// Un chunk de stdin puede partir un mensaje por la mitad: acumulamos y solo
// parseamos líneas completas.
let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  const lineas = buffer.split("\n");
  buffer = lineas.pop() || "";
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(linea);
    } catch {
      continue;
    }
    atender(msg).catch((e) => {
      if (msg?.id !== undefined) fallar(msg.id, -32603, e.message);
    });
  }
});
process.stdin.on("end", () => process.exit(0));

console.error("[mcp-clickup] listo. team:", TEAM);
