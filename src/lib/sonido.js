// Micro-sonidos de F*ctito.
//
// Se sintetizan con Web Audio en vez de cargar ficheros: son tonos de menos de
// un cuarto de segundo, así que un mp3 pesaría más que el código que lo genera
// y además habría que esperar a que descargue.
//
// Criterio de diseño: que se noten menos que un clic de teclado. Ondas seno
// (sin armónicos ásperos), volumen por debajo de 0.05 y una envolvente con
// ataque y caída suaves — un tono que arranca o corta de golpe suena a pitido
// de electrodoméstico.
//
// Silencio cuando toca: si el sistema pide menos animación, si la pestaña está
// en segundo plano, o si se ha apagado desde la propia barra.

const CLAVE = "fcts:asistente:sonido";
let ctx = null;

export function sonidoActivo() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CLAVE) !== "off";
  } catch {
    return true; // sin localStorage (privado, bloqueado) no es motivo para callar
  }
}

// Store mínimo para que la UI pueda pintar el estado sin sincronizarlo con un
// efecto (que es justo lo que React desaconseja).
const oyentes = new Set();
export function suscribirSonido(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
export const snapSonido = () => sonidoActivo();
// En el servidor no hay preferencia: se asume encendido y el cliente corrige.
export const snapSonidoServidor = () => true;

export function setSonido(activo) {
  try {
    window.localStorage.setItem(CLAVE, activo ? "on" : "off");
  } catch {
    /* si no se puede guardar, al menos vale para esta sesión */
  }
  for (const fn of oyentes) fn();
}

function contexto() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  // Se crea al primer sonido, que siempre viene de un gesto: crearlo antes lo
  // dejaría suspendido y el navegador se quejaría.
  ctx ??= new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Una nota. `t` es el desplazamiento en segundos desde ahora, para encadenar.
function nota(freq, { t = 0, dur = 0.12, vol = 0.035, tipo = "sine" } = {}) {
  const ac = contexto();
  if (!ac) return;
  const inicio = ac.currentTime + t;
  const osc = ac.createOscillator();
  const gan = ac.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, inicio);
  // Ataque de 12ms y caída exponencial: sin esto se oye el "clic" del corte.
  gan.gain.setValueAtTime(0.0001, inicio);
  gan.gain.exponentialRampToValueAtTime(vol, inicio + 0.012);
  gan.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  osc.connect(gan).connect(ac.destination);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.02);
}

// Escala pentatónica: cualquier combinación suena bien junta, que es lo que
// interesa cuando dos sonidos pueden solaparse.
const LA = 440;
const NOTAS = { do: LA * 1.189, re: LA * 1.335, mi: LA * 1.498, sol: LA * 1.782, la: LA * 2 };

const SONIDOS = {
  // Sale algo: dos notas subiendo, muy corto.
  enviar: () => { nota(NOTAS.mi, { dur: 0.09, vol: 0.03 }); nota(NOTAS.sol, { t: 0.055, dur: 0.11, vol: 0.028 }); },
  // Llega algo: bajan, como un "ya está".
  respuesta: () => { nota(NOTAS.la, { dur: 0.1, vol: 0.026 }); nota(NOTAS.mi, { t: 0.07, dur: 0.16, vol: 0.022 }); },
  abrir: () => nota(NOTAS.re, { dur: 0.1, vol: 0.022 }),
  cerrar: () => nota(NOTAS.do, { dur: 0.12, vol: 0.018 }),
  nuevo: () => { nota(NOTAS.do, { dur: 0.08, vol: 0.022 }); nota(NOTAS.sol, { t: 0.05, dur: 0.12, vol: 0.02 }); },
  // Algo falló: una sola nota grave, sin estridencia.
  error: () => nota(NOTAS.do / 2, { dur: 0.22, vol: 0.03, tipo: "triangle" }),
};

export function sonar(tipo) {
  if (typeof window === "undefined") return;
  if (!sonidoActivo()) return;
  if (document.hidden) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    SONIDOS[tipo]?.();
  } catch {
    /* el audio nunca puede romper una interacción */
  }
}
