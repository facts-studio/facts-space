import { NextResponse } from "next/server";
import { empleadoDeToken } from "@/lib/data/tokens";
import { comoEmpleado } from "@/lib/data/helpers";
import { herramientasPara } from "@/lib/mcp/tools";

// F*ctito como MCP: el portal, contestando desde ChatGPT o Claude.
//
// Se habla JSON-RPC 2.0 sobre HTTP (transporte "streamable"), que es lo que
// entienden los conectores remotos. No hace falta el SDK: son tres métodos
// —initialize, tools/list y tools/call— y escribirlos a mano deja claro qué
// entra y qué sale, que en algo que expone datos del equipo importa.
//
// La identidad viene en el token personal: F*ctito responde COMO esa persona,
// con sus permisos, no con los de un servicio que lo ve todo.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSION_PROTOCOLO = "2025-06-18";

const rpc = (id, result) => NextResponse.json({ jsonrpc: "2.0", id, result });
const rpcError = (id, code, message, status = 200) =>
  NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status });

function tokenDe(request, enRuta) {
  if (enRuta) return enRuta;
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-fctito-token") || null;
}

// El handler es común: el token puede venir en la cabecera (Claude y cualquier
// cliente decente) o en la propia URL (ChatGPT, que en sus conectores solo
// ofrece OAuth o nada — ver src/app/api/mcp/[token]/route.js).
export async function manejar(request, enRuta = null) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return rpcError(null, -32700, "JSON no válido");
  }
  const { id = null, method, params = {} } = cuerpo ?? {};

  // `initialize` se contesta sin token: el cliente necesita saber con quién
  // habla antes de mandar credenciales.
  if (method === "initialize") {
    return rpc(id, {
      protocolVersion: VERSION_PROTOCOLO,
      capabilities: { tools: {} },
      serverInfo: { name: "fctito", title: "F*ctito · Portal de F*cts Studio", version: "1.0.0" },
      instructions:
        "F*ctito responde con los datos del portal de F*cts Studio como la persona dueña del token: " +
        "sus tareas, sus vacaciones, los proyectos que puede ver y el equipo. No tiene acceso a nóminas, " +
        "contratos, datos bancarios ni a las ausencias de otras personas.",
    });
  }
  // Las notificaciones (sin id) no llevan respuesta.
  if (method === "notifications/initialized") return new NextResponse(null, { status: 202 });

  const me = await empleadoDeToken(tokenDe(request, enRuta));
  if (!me) return rpcError(id, -32001, "Token no válido o revocado.", 401);
  if (me.active === false) return rpcError(id, -32001, "Esa cuenta ya no está activa.", 401);

  const herramientas = herramientasPara(me);

  if (method === "tools/list") {
    return rpc(id, {
      tools: herramientas.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    });
  }

  if (method === "tools/call") {
    const h = herramientas.find((x) => x.name === params?.name);
    if (!h) return rpcError(id, -32602, `F*ctito no tiene la herramienta «${params?.name}».`);
    try {
      // Todo lo que pase de aquí cree que es esa persona: las lecturas heredan
      // su recorte sin tener que acordarse de filtrar en cada una.
      const salida = await comoEmpleado(me, () => h.run(params.args ?? params.arguments ?? {}, me));
      return rpc(id, { content: [{ type: "text", text: JSON.stringify(salida, null, 1) }] });
    } catch (e) {
      return rpc(id, { isError: true, content: [{ type: "text", text: `No ha podido ser: ${e.message}` }] });
    }
  }

  return rpcError(id, -32601, `Método no soportado: ${method}`);
}

export async function POST(request) {
  return manejar(request);
}

// Un GET a mano (o el navegador) no debe parecer un error de servidor.
export async function GET() {
  return NextResponse.json({
    nombre: "F*ctito",
    descripcion: "Servidor MCP del portal de F*cts Studio. Habla JSON-RPC por POST con un token personal.",
    protocolo: VERSION_PROTOCOLO,
  });
}
