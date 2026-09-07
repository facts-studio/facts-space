import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getCurrentEmployee } from "@/lib/data/helpers";
import {
  entornoLimpio,
  hostPermitido,
  origenDeLaInterfaz,
  gestoReciente,
  comprobarRitmo,
  anotarTurno,
} from "@/lib/lineasRojas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// F*ctito — el asistente del portal, servido SOLO por tu máquina, a propósito.
//
// No habla con la API de Anthropic: lanza el `claude` que ya está instalado
// aquí, que se autentica con la suscripción de su dueño. Por eso no gasta
// créditos... y por eso no puede existir en Vercel: allí no hay sesión de
// Claude Code, solo habría API key (= facturación por uso).
//
// La frontera es dura: si esto corre en Vercel, la ruta no existe. Mejor un 404
// honesto que un endpoint que en producción solo sabe fallar.

const RAIZ = process.cwd();

// El CLI vive en ~/.local/bin, que no está en el PATH que hereda `next dev`
// cuando arranca desde launchd. Resolvemos a mano antes de rendirnos al PATH.
function resolverClaude() {
  if (process.env.CLAUDE_BIN && existsSync(process.env.CLAUDE_BIN)) return process.env.CLAUDE_BIN;
  const candidatos = [
    path.join(homedir(), ".local/bin/claude"),
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
  ];
  return candidatos.find((p) => existsSync(p)) || "claude";
}

// Solo herramientas de datos: ClickUp (proyectos y tareas) y Granola (notas de
// reuniones). Sin Bash, sin Edit, sin Write — este chat consulta y actualiza
// trabajo, no toca la máquina ni el repositorio. Lo que no esté permitido, en
// modo -p se deniega solo (no hay nadie para aprobar un diálogo).
//
// Granola es un MCP por HTTP con OAuth: si la cuenta no está autenticada, sus
// herramientas simplemente no aparecen y el resto sigue funcionando.
const TOOLS = "mcp__clickup,mcp__granola";

const SYSTEM = `Te llamas F*ctito y eres el asistente del portal de F*cts Studio, embebido en su propia interfaz. Si te preguntan quién eres, ese es tu nombre — sin ceremonias ni presentarte en cada respuesta.

Hablas con alguien del equipo del estudio. Responde SIEMPRE en español, en tono directo y breve — esto es una ventana de chat estrecha, no un informe.

Tienes ClickUp (mcp__clickup__*), que es donde vive el trabajo: proyectos (list_proyectos), su estado (resumen_proyecto), tareas (list_tareas, get_tarea), entregas y fechas clave (list_hitos) y el cambio de estado de una tarea (list_estados + set_estado_tarea). Úsalas en vez de suponer: son datos reales del estudio.

Vocabulario: un "proyecto" es una lista de ClickUp dentro de la carpeta de un cliente. Los sprints y los proyectos temporales son listas con fechas de inicio y fin — cuando pregunten "cuándo termina X", esa fecha de fin es la respuesta. Un "hito" es una tarea marcada como milestone: es una entrega, no trabajo en curso.

Tienes también Granola (mcp__granola__*), donde están las notas y transcripciones de las reuniones, organizadas en carpetas por cliente igual que ClickUp. Úsalo cuando pregunten por lo que se dijo o se acordó en una reunión, o cuando pidan sacar tareas o acuerdos de una. Si Granola no responde, dilo en vez de inventarte el contenido.

Reglas:
- Nunca inventes cifras ni fechas. Si no lo has consultado, consúltalo.
- Antes de escribir en ClickUp (cambiar el estado de una tarea), consulta list_estados para usar un nombre válido, y si la petición es ambigua —qué tarea, a qué estado— pregunta primero.
- Da el resultado, no el proceso. Nada de "voy a consultar...".
- Las fechas, en formato español y en lenguaje natural ("el 8 de septiembre", "en 3 días").
- Markdown ligero: negritas y listas. Sin cabeceras enormes.`;

// OJO con el criterio de "¿esto lo sirve mi máquina?".
//
// `process.env.VERCEL` NO sirve: el .env.local puede salir de `vercel env pull`,
// así que trae VERCEL=1 dentro y el portal de la propia máquina se creería
// Vercel. El discriminante bueno es por dónde ha entrado la petición: en
// producción el Host es el dominio real, que nunca está en la lista de
// permitidos (ver src/lib/lineasRojas.js).
function peticionLocal(req) {
  return hostPermitido(req.headers.get("host"));
}

export async function POST(req) {
  if (!peticionLocal(req)) {
    return NextResponse.json(
      { error: "F*ctito solo lo sirve tu máquina (usa la suscripción que hay en ella)." },
      { status: 404 }
    );
  }

  // Sesión de navegador con empleado dado de alta: la misma puerta que el resto
  // del portal. Un servicio o un script no tiene ficha.
  const me = await getCurrentEmployee();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // La petición nace de la interfaz abierta, no de curl ni de un cron.
  if (!origenDeLaInterfaz(req)) {
    return NextResponse.json(
      { error: "F*ctito solo responde desde su propia interfaz." },
      { status: 403 }
    );
  }

  const bin = resolverClaude();
  if (bin === "claude" && !existsSync(bin)) {
    return NextResponse.json(
      { error: "No encuentro el CLI de Claude en esta máquina." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const mensaje = String(body?.mensaje || "").trim();
  if (!mensaje) return NextResponse.json({ error: "mensaje vacío" }, { status: 400 });

  // Detrás tiene que haber una persona que acabe de teclear o pulsar algo.
  if (!gestoReciente(body?.gesto)) {
    return NextResponse.json(
      { error: "No hay nadie delante: F*ctito solo responde a una persona usando el portal." },
      { status: 403 }
    );
  }

  const ritmo = comprobarRitmo();
  if (!ritmo.ok) return NextResponse.json({ error: ritmo.motivo }, { status: 429 });
  anotarTurno();

  // Con sessionId seguimos la conversación; sin él, empezamos una nueva y se lo
  // devolvemos al cliente al terminar para que la siga en el turno siguiente.
  const previa = typeof body?.sessionId === "string" && body.sessionId ? body.sessionId : null;
  const sessionId = previa || randomUUID();

  const args = [
    "-p", mensaje,
    "--output-format", "stream-json",
    "--include-partial-messages",
    "--verbose",
    "--allowedTools", TOOLS,
    // Tras cada turno propone la siguiente pregunta; la pintamos como chip.
    "--prompt-suggestions",
    "--append-system-prompt", `${SYSTEM}\n\nQuien te escribe es ${me.name}${me.role ? ` (${me.role})` : ""}.`,
    ...(previa ? ["--resume", previa] : ["--session-id", sessionId]),
  ];

  // El entorno se limpia de credenciales ANTES de lanzar el CLI: ni claves de
  // API ni tokens de `setup-token`. El detalle de por qué cada una, y el resto
  // de líneas rojas, está en src/lib/lineasRojas.js.
  const entorno = entornoLimpio({
    ...process.env,
    PATH: `${process.env.PATH || ""}:${path.join(homedir(), ".local/bin")}`,
  });

  const hijo = spawn(bin, args, {
    cwd: RAIZ,
    env: entorno,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const enc = new TextEncoder();
  // Corte duro: un turno colgado no puede dejar un `claude` vivo para siempre.
  const limite = setTimeout(() => hijo.kill("SIGTERM"), 5 * 60_000);

  const stream = new ReadableStream({
    start(controller) {
      let cerrado = false;
      const send = (obj) => {
        if (cerrado) return;
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          cerrado = true;
        }
      };

      // El stream del CLI llega en NDJSON, pero un chunk puede partir una línea
      // por la mitad: acumulamos y solo parseamos líneas completas.
      let resto = "";
      let errores = "";

      hijo.stdout.on("data", (chunk) => {
        resto += chunk.toString();
        const lineas = resto.split("\n");
        resto = lineas.pop() || "";
        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let d;
          try {
            d = JSON.parse(linea);
          } catch {
            continue;
          }
          traducir(d, send);
        }
      });

      hijo.stderr.on("data", (chunk) => {
        errores += chunk.toString();
      });

      hijo.on("error", (e) => {
        send({ t: "error", v: `No se pudo lanzar Claude: ${e.message}` });
        clearTimeout(limite);
        if (!cerrado) controller.close();
        cerrado = true;
      });

      hijo.on("close", (code) => {
        clearTimeout(limite);
        if (code !== 0) {
          send({ t: "error", v: errores.trim().slice(0, 500) || `Claude terminó con código ${code}` });
        }
        send({ t: "fin", sessionId });
        if (!cerrado) controller.close();
        cerrado = true;
      });
    },
    cancel() {
      // Cerró la pestaña o pulsó parar: no dejamos el proceso huérfano.
      clearTimeout(limite);
      hijo.kill("SIGTERM");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

// Traduce el stream del CLI al mínimo que le importa a la interfaz:
// texto que se escribe, qué herramienta está usando, y el fin de turno.
function traducir(d, send) {
  if (d.type === "stream_event") {
    const e = d.event || {};
    if (e.type === "content_block_delta" && e.delta?.type === "text_delta") {
      send({ t: "texto", v: e.delta.text });
    } else if (e.type === "content_block_start" && e.content_block?.type === "tool_use") {
      send({ t: "tool", v: e.content_block.name || "" });
    }
    return;
  }
  if (d.type === "prompt_suggestion") {
    // Llega DESPUÉS del `result`, así que el turno ya está pintado cuando
    // aparece el chip. Solo viene una por turno.
    if (d.suggestion) send({ t: "sugerencia", v: String(d.suggestion) });
    return;
  }
  if (d.type === "result") {
    // `result` trae el texto completo del turno. Solo lo usamos como red de
    // seguridad: si por lo que sea no llegó ningún delta, al menos hay respuesta.
    if (d.subtype !== "success") {
      send({ t: "error", v: String(d.subtype || "El turno no terminó bien") });
    }
    send({ t: "resultado", v: typeof d.result === "string" ? d.result : "" });
  }
}
