"use client";

// El chat en sí: hilo + caja de escribir. No tiene estado propio de la
// conversación — todo vive en el contexto (lib/asistente.jsx), así que se puede
// montar a la vez en la columna y a pantalla completa mostrando lo mismo.

import { useState, useRef, useEffect, useCallback } from "react";
import { useAsistente } from "@/lib/asistente";

// Los cuatro iconos que usa el chat, en línea: este proyecto no tiene un set
// <Icon> y montar uno entero para esto sería mover mucho por muy poco.
const ICONOS = {
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  "arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
  "arrow-down": <path d="M12 5v14M18 13l-6 6-6-6" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
};

function Icono({ name, className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {ICONOS[name]}
    </svg>
  );
}

const SUGERENCIAS = [
  "¿Cuántas tareas activas tiene Black Friday?",
  "¿Qué hay vencido?",
  "¿Cuándo termina el Lanzamiento Sept.?",
  "¿Qué entregas quedan este mes?",
];

// "consultando proyectos" dice bastante más que "mcp__clickup__list_proyectos".
const TOOL_LABEL = {
  list_proyectos: "consultando proyectos",
  resumen_proyecto: "mirando el proyecto",
  list_tareas: "consultando tareas",
  get_tarea: "leyendo la tarea",
  list_estados: "mirando los estados",
  set_estado_tarea: "cambiando el estado",
  list_hitos: "revisando entregas",
  // Granola (notas de reuniones)
  list_meetings: "buscando reuniones",
  get_meetings: "buscando reuniones",
  query_granola_meetings: "buscando en las reuniones",
  get_meeting_transcript: "leyendo la reunión",
  list_meeting_folders: "mirando las carpetas",
};

// null para herramientas internas: en esos pasos preferimos el "pensando…"
// genérico a un "trabajando…" que no informa de nada.
function etiquetaTool(name = "") {
  return TOOL_LABEL[name.replace(/^mcp__(clickup|granola)__/, "")] || null;
}

// Markdown mínimo: **negrita**, *cursiva*, `código` y enlaces. No metemos una
// librería entera — el asistente escribe plano por instrucción.
//
// Se recorre con un tokenizador y no con split(regex) porque la cursiva NO
// puede activarse con un asterisco PEGADO a una palabra: el propio asistente se
// llama F*ctito y el estudio F*cts, así que «F*ctito, el asistente» se leía
// como una cursiva abierta y salía «Fctito» a medias. Regla: el `*` de apertura
// va tras un espacio o al principio, y el de cierre antes de espacio o signo.
// El contenido de la negrita SÍ admite asteriscos sueltos: «**F*ctito**» es
// justo el caso que se daba, y con [^*] la negrita no casaba y los marcadores
// se quedaban a la vista. No-greedy para no tragarse dos negritas seguidas.
const RE_NEGRITA = /\*\*([^\n]+?)\*\*/y;
const RE_CURSIVA = /\*([^*\n]+)\*/y;
const RE_CODIGO = /`([^`\n]+)`/y;
const RE_URL = /https?:\/\/\S+/y;

const esLimite = (c) => c === undefined || /[\s.,;:!?)("'—–-]/.test(c);

function tokenizar(texto) {
  const out = [];
  let buffer = "";
  let i = 0;
  const suelta = () => { if (buffer) { out.push({ t: "txt", v: buffer }); buffer = ""; } };

  while (i < texto.length) {
    const c = texto[i];
    const antes = i === 0 ? undefined : texto[i - 1];

    if (c === "*" && texto[i + 1] === "*") {
      RE_NEGRITA.lastIndex = i;
      const m = RE_NEGRITA.exec(texto);
      if (m) { suelta(); out.push({ t: "b", v: m[1] }); i += m[0].length; continue; }
    }
    // Cursiva solo si el asterisco NO está pegado por la izquierda a texto.
    if (c === "*" && esLimite(antes)) {
      RE_CURSIVA.lastIndex = i;
      const m = RE_CURSIVA.exec(texto);
      if (m && esLimite(texto[i + m[0].length])) {
        suelta(); out.push({ t: "i", v: m[1] }); i += m[0].length; continue;
      }
    }
    if (c === "`") {
      RE_CODIGO.lastIndex = i;
      const m = RE_CODIGO.exec(texto);
      if (m) { suelta(); out.push({ t: "code", v: m[1] }); i += m[0].length; continue; }
    }
    if (c === "h") {
      RE_URL.lastIndex = i;
      const m = RE_URL.exec(texto);
      if (m) { suelta(); out.push({ t: "url", v: m[0] }); i += m[0].length; continue; }
    }
    buffer += c;
    i++;
  }
  suelta();
  return out;
}

function Inline({ texto }) {
  return tokenizar(texto).map((tk, j) => {
    if (tk.t === "b") return <strong key={j} className="font-semibold">{tk.v}</strong>;
    if (tk.t === "i") return <em key={j} className="italic">{tk.v}</em>;
    if (tk.t === "code") {
      return (
        <code key={j} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.88em] font-mono">
          {tk.v}
        </code>
      );
    }
    if (tk.t === "url") {
      return (
        <a
          key={j}
          href={tk.v}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-mutedSoft underline-offset-2 transition-colors hover:decoration-ink"
        >
          {tk.v.replace(/^https?:\/\//, "").slice(0, 42)}
        </a>
      );
    }
    return <span key={j}>{tk.v}</span>;
  });
}

// Agrupa el texto en BLOQUES —párrafos y listas— en vez de pintar línea a
// línea. Antes cada salto era un div y cada línea en blanco un hueco fijo, así
// que dos blancos seguidos abrían un agujero enorme en mitad de la respuesta.
// Ahora los blancos solo separan: el aire lo pone el espaciado entre bloques.
function Formateado({ texto }) {
  const bloques = [];
  let lista = null;
  for (const linea of texto.split("\n")) {
    if (/^\s*[-*•]\s+/.test(linea)) {
      if (!lista) { lista = { tipo: "lista", items: [] }; bloques.push(lista); }
      lista.items.push(linea.replace(/^\s*[-*•]\s+/, ""));
      continue;
    }
    lista = null;
    if (!linea.trim()) continue;
    bloques.push({ tipo: "p", texto: linea });
  }

  return (
    <div className="space-y-2.5">
      {bloques.map((b, i) =>
        b.tipo === "lista" ? (
          <ul key={i} className="space-y-1">
            {b.items.map((it, j) => (
              // Sangría francesa: el texto que sigue a un salto de línea se
              // alinea con la primera palabra, no con la viñeta.
              <li key={j} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.62em] h-1 w-1 shrink-0 rounded-full bg-mutedSoft" />
                <span className="min-w-0 flex-1"><Inline texto={it} /></span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}><Inline texto={b.texto} /></p>
        )
      )}
    </div>
  );
}

function Burbuja({ msg, ultima, ocupado, onSugerencia, onReintentar }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(msg.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1400);
    } catch {}
  };

  if (msg.rol === "yo") {
    return (
      <div className="msg-in flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink/[0.06] px-3.5 py-2 text-small text-ink whitespace-pre-wrap">
          {msg.texto}
        </div>
      </div>
    );
  }

  const escribiendo = ultima && ocupado && !!msg.texto;
  const esperando = (msg.pensando || msg.tool) && !msg.texto;

  return (
    <div className="msg-in group/msg space-y-1.5">
      {esperando && (
        <div className="shimmer w-fit text-small">
          {etiquetaTool(msg.tool) ? `${etiquetaTool(msg.tool)}…` : "pensando…"}
        </div>
      )}

      {msg.texto && (
        <div className={`text-small leading-[1.65] text-ink ${escribiendo ? "caret" : ""}`}>
          <Formateado texto={msg.texto} />
        </div>
      )}

      {msg.error && (
        <div className="space-y-2 rounded-xl bg-dangerSoft/40 px-3 py-2.5">
          <div className="text-caption text-danger whitespace-pre-wrap">{msg.error}</div>
          <button
            onClick={onReintentar}
            className="text-caption font-medium text-danger underline underline-offset-2 hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Acciones del mensaje: aparecen al pasar por encima. En reposo el hilo
          queda limpio; al acercarte, están donde esperas. */}
      {msg.texto && !escribiendo && (
        <div className="-ml-1.5 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={copiar}
            aria-label={copiado ? "Copiado" : "Copiar respuesta"}
            title={copiado ? "Copiado" : "Copiar"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-mutedSoft
              transition duration-150 ease-[var(--ease-out)] hover:bg-ink/[0.06] hover:text-ink active:scale-95
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
          >
            <Icono name={copiado ? "check" : "copy"} className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Siguiente pregunta sugerida. Solo bajo la ÚLTIMA respuesta: en las
          anteriores ya se ve qué se preguntó después. */}
      {msg.sugerencia && ultima && !ocupado && (
        <button
          onClick={() => onSugerencia(msg.sugerencia)}
          className="msg-in mt-1 rounded-full border border-border/70 px-3 py-1.5 text-left text-caption text-inkSoft
            transition duration-150 ease-[var(--ease-out)] hover:border-border hover:bg-ink/[0.05] active:scale-[0.98]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          {msg.sugerencia}
        </button>
      )}
    </div>
  );
}

// `sinCompositor`: pinta solo el hilo. Lo usa el asistente flotante de la home,
// donde la caja de escribir es la píldora de abajo y no puede ir dentro del
// panel de mensajes.
export default function AsistenteChat({ autoFocus = false, sinCompositor = false }) {
  const { mensajes, ocupado, enviar, parar, reintentar } = useAsistente();
  const [texto, setTexto] = useState("");
  const [pegadoAbajo, setPegadoAbajo] = useState(true);
  const scrollRef = useRef(null);
  const finalRef = useRef(null);
  const taRef = useRef(null);

  // Autoscroll SOLO si ya estabas abajo. Si has subido a releer algo, que siga
  // llegando la respuesta no debe arrancarte de donde estás mirando.
  const cercaDelFinal = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (pegadoAbajo) finalRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes, pegadoAbajo]);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  // El textarea crece con el contenido, hasta un tope.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [texto]);

  const mandar = (v) => {
    const q = v ?? texto;
    if (!q.trim() || ocupado) return;
    setTexto("");
    setPegadoAbajo(true);
    enviar(q);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      mandar();
    }
  };

  const vacio = mensajes.length === 0;
  const puedeEnviar = !!texto.trim();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={() => setPegadoAbajo(cercaDelFinal())}
        // `overscroll-contain`: al llegar arriba o abajo del hilo, la rueda NO
        // sigue moviendo la página de detrás. El scroll se queda donde estás
        // mirando.
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {vacio ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-2 text-center">
            <div className="max-w-xs space-y-1.5">
              <div className="text-body font-semibold text-ink">¿Qué necesitas?</div>
              <div className="text-small leading-relaxed text-muted">
                Pregunta por proyectos, tareas y entregas — o por lo que se dijo en una reunión.
              </div>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-1.5">
              {SUGERENCIAS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => mandar(s)}
                  // Escalonado corto: entran en cascada, no todas de golpe.
                  style={{ animationDelay: `${i * 45}ms` }}
                  className="msg-in rounded-full border border-border/70 px-3 py-1.5 text-caption text-inkSoft
                    transition duration-150 ease-[var(--ease-out)] hover:border-border hover:bg-ink/[0.05] active:scale-[0.98]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-2" aria-live="polite">
            {mensajes.map((m, i) => (
              <Burbuja
                key={i}
                msg={m}
                ultima={i === mensajes.length - 1}
                ocupado={ocupado}
                onSugerencia={mandar}
                onReintentar={reintentar}
              />
            ))}
            <div ref={finalRef} />
          </div>
        )}
      </div>

      {/* Volver abajo — solo si te has ido hacia arriba. */}
      {!vacio && !pegadoAbajo && (
        <div className="relative">
          <button
            onClick={() => {
              setPegadoAbajo(true);
              finalRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }}
            aria-label="Ir al final"
            className="msg-in absolute -top-11 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center
              rounded-full border border-border/60 bg-paper text-inkSoft shadow-card
              transition duration-150 hover:text-ink active:scale-95"
          >
            <Icono name="arrow-down" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {sinCompositor ? null : (
      <>
      {/* Compositor: el envío vive DENTRO del campo. Menos piezas en pantalla y
          la acción justo donde está la mirada al terminar de escribir. */}
      {/* Compositor. En FLEX, no con el botón en absoluto: así el centrado en
          una línea y el anclaje abajo al crecer salen solos, sin cuadrar
          píxeles a mano.

          Las medidas están atadas entre sí a propósito:
          · caja p-1.5 (6px) y radio exterior 20px → el botón lleva 14px
            (20 − 6). Radios concéntricos: si no, la curva de dentro y la de
            fuera no son paralelas y se ve, aunque no se sepa por qué.
          · el textarea a una línea mide 13px × 1.5 + 6px arriba y abajo = 32px,
            exactamente el alto del botón. Por eso `items-end` los deja
            alineados en reposo y ancla el botón abajo cuando el texto crece. */}
      <div className="shrink-0 pt-2.5">
        <div className="flex items-end gap-1.5 rounded-2xl bg-surface2/60 p-1.5 pl-3 transition-colors duration-150 focus-within:bg-surface2">
          <textarea
            ref={taRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Pregunta o pide algo…"
            className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-small leading-[1.5] text-ink
              outline-none placeholder:text-mutedSoft"
          />
          <button
            type="button"
            onClick={() => (ocupado ? parar() : mandar())}
            disabled={!ocupado && !puedeEnviar}
            aria-label={ocupado ? "Parar" : "Enviar"}
            title={ocupado ? "Parar" : "Enviar"}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]
              transition duration-150 ease-[var(--ease-out)] active:scale-95
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25
              ${ocupado || puedeEnviar
                ? "bg-ink text-paper hover:opacity-90"
                // Sin fondo mientras no hay nada que enviar: una caja gris sobre
                // otra caja gris solo añade ruido. Que el botón "aparezca" al
                // escribir es además la señal de que ya se puede mandar.
                : "cursor-not-allowed text-mutedSoft/70"}`}
          >
            <Icono name={ocupado ? "stop" : "arrow-up"} className="h-4 w-4" />
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
