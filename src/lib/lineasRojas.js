// Las líneas rojas del uso de la suscripción, hechas cumplir por código.
//
// El asistente (F*ctito) lanza el Claude Code oficial de esta máquina, que se
// autentica con la suscripción personal. Los términos de consumo de Anthropic ponen
// límites a eso, y hay tres que sí se pueden vigilar desde aquí:
//
//   1. Nada de reutilizar credenciales fuera de la herramienta oficial. El
//      panel nunca debe pasarle una credencial al CLI —ni API key ni token de
//      `setup-token`—: quien se autentica es el binario, contra el Llavero.
//   2. Nada de acceso automatizado no humano. Cada turno tiene que nacer de
//      una persona escribiendo en la interfaz, no de un script, un cron o un
//      webhook.
//   3. Un solo usuario, y siempre el dueño de la suscripción. Lo que importa
//      es QUIÉN escribe, no desde dónde: entrar a tu propia máquina desde tu
//      propio móvil es el mismo acto que abrir una terminal en ella. Lo que no
//      cabe es que entre nadie más. Por eso los hosts permitidos son una lista
//      EXACTA y corta (ver `hostPermitido`), nunca un comodín.
//
// Lo que este módulo NO puede hacer, y conviene decirlo: no interpreta los
// términos ni certifica que el uso sea conforme. Hace cumplir la lectura que
// hemos tomado por buena. Si Anthropic dijera otra cosa, esto no protege de
// nada — habría que cambiar el uso, no las comprobaciones.

// ── 1. Credenciales ────────────────────────────────────────────────────────
//
// Todo lo que pudiera autenticar al CLI por su cuenta se borra del entorno
// antes de lanzarlo. Dos motivos distintos apuntando al mismo sitio:
//
//   · ANTHROPIC_API_KEY y compañía harían que el turno se facturase por API
//     (y de paso apagan los conectores de la cuenta).
//   · CLAUDE_CODE_OAUTH_TOKEN es el token de larga duración de `setup-token`,
//     pensado para CI y automatizaciones desatendidas. Es exactamente la
//     credencial que los términos señalan, así que aquí no se usa nunca:
//     aunque alguien la exportase en su shell, el CLI no la verá.
export const CREDENCIALES_PROHIBIDAS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_OAUTH_TOKEN",
];

export function entornoLimpio(base) {
  const env = { ...base };
  for (const k of CREDENCIALES_PROHIBIDAS) delete env[k];
  return env;
}

// ── Dónde puede vivir la interfaz ──────────────────────────────────────────
//
// UNA sola definición de "host permitido", que usan tanto la ruta (por dónde
// entró la petición) como la comprobación de origen (qué página la lanzó).
// Antes eran dos listas distintas en dos sitios distintos, y bastaba tocar una
// para que dejaran de decir lo mismo.
//
// Por defecto solo loopback: la interfaz vive en la máquina y punto.
//
// ASISTENTE_HOSTS amplía la lista con hostnames EXACTOS, separados por comas.
// Su único uso previsto es una red privada de tus propios dispositivos (tipo
// Tailscale), para poder escribirle desde el móvil sin exponer nada a internet.
// Nunca un comodín, nunca un dominio público: cada nombre que se añada aquí es
// una puerta más, y las puertas se cuentan de una en una.
const LOOPBACK = ["localhost", "127.0.0.1", "::1", "[::1]"];

function hostsExtra() {
  return String(process.env.ASISTENTE_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

// Acepta "host", "host:puerto" o una URL; devuelve si ese host puede servir la
// interfaz del asistente.
export function hostPermitido(valor) {
  if (!valor) return false;
  let host = String(valor).trim().toLowerCase();
  if (host.includes("://")) {
    try { host = new URL(host).hostname; } catch { return false; }
  } else {
    // Quita el puerto sin romper IPv6 entre corchetes.
    host = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  }
  host = host.replace(/^\[|\]$/g, "");
  return LOOPBACK.includes(host) || LOOPBACK.includes(`[${host}]`) || hostsExtra().includes(host);
}

// ── 2. Que detrás haya una persona ─────────────────────────────────────────
//
// Tres comprobaciones que un script no pasa por accidente.

// (a) La petición viene de la interfaz abierta en un navegador. `curl`, un
// cron o un webhook no ponen Origin, y un Origin ajeno no vale aunque las
// cookies viajen igual (el navegador las manda por host, ignorando el puerto).
export function origenDeLaInterfaz(req) {
  const origen = req.headers.get("origin");
  const referer = req.headers.get("referer") || "";
  const vale = (u) => hostPermitido(u);
  if (origen) return vale(origen);
  // Sin Origin solo se admite un Referer de la propia interfaz; sin ninguno de
  // los dos, la petición no nace de una página abierta.
  return referer ? vale(referer) : false;
}

// (b) Acaba de haber un gesto humano. El cliente manda cuántos milisegundos
// hace de la última tecla o clic REAL; si hace demasiado, o si no lo manda,
// no hay nadie delante. Es lo que separa «alguien escribiendo» de «una pestaña
// olvidada que dispara sola».
export const GESTO_MAX_MS = 120_000;

export function gestoReciente(gesto) {
  const ms = Number(gesto);
  return Number.isFinite(ms) && ms >= 0 && ms <= GESTO_MAX_MS;
}

// (c) Ritmo de persona. Nadie escribe dos preguntas en el mismo segundo, ni
// cientos en una hora. Los topes van holgados a propósito: no están para
// racionar el uso, sino para que una automatización se choque con ellos.
export const RITMO = {
  separacionMs: 1_000,   // entre dos turnos seguidos
  porHora: 60,
  porDia: 300,
};

// El contador vive en memoria del proceso: se reinicia con el servidor y no
// deja rastro en disco. No es a prueba de nada —quien controla la máquina
// puede reiniciarlo— pero no es de eso de lo que protege: protege de que un
// bucle mal escrito, propio o ajeno, se ponga a preguntar solo.
const turnos = [];
let ultimo = 0;

export function comprobarRitmo(ahora = Date.now()) {
  if (ahora - ultimo < RITMO.separacionMs) {
    return { ok: false, motivo: "Vas demasiado rápido para ser tú. Espera un segundo." };
  }
  const haceUnaHora = ahora - 3_600_000;
  const haceUnDia = ahora - 86_400_000;
  while (turnos.length && turnos[0] < haceUnDia) turnos.shift();
  if (turnos.filter((t) => t >= haceUnaHora).length >= RITMO.porHora) {
    return { ok: false, motivo: `Tope de ${RITMO.porHora} preguntas por hora. Es un límite de seguridad, no de uso: si lo tocas escribiendo tú, súbelo.` };
  }
  if (turnos.length >= RITMO.porDia) {
    return { ok: false, motivo: `Tope de ${RITMO.porDia} preguntas al día.` };
  }
  return { ok: true };
}

export function anotarTurno(ahora = Date.now()) {
  ultimo = ahora;
  turnos.push(ahora);
}
