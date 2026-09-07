"use client";

// Estado de F*ctito, compartido por todo el portal.
//
// Vive en el layout (no en una pantalla) por dos razones: la conversación
// sobrevive al cambiar de sección, y una respuesta a medias sigue escribiéndose
// aunque navegues a otro sitio mientras tanto.

import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";


const Ctx = createContext(null);

// F*ctito solo existe cuando el portal lo sirve tu máquina: es ahí donde vive
// la sesión de Claude Code. Se comprueba en cliente (y otra vez en el servidor,
// que es quien manda: ver src/lib/lineasRojas.js).
const esLocal = () => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
};

const ABIERTO_KEY = "fcts:asistente:abierto";
const HIST_KEY = "fcts:asistente:historial";
const HIST_MAX = 10;

// El historial vive en localStorage y no en la base de datos a propósito: son
// conversaciones de trabajo de ESTA máquina, igual que el propio F*ctito. Y
// guardamos el sessionId porque el CLI sabe retomarlo (--resume): al abrir una
// conversación vieja se sigue de verdad, no se relee un texto muerto.
//
// Se lee con useSyncExternalStore y no con un efecto que hace setState: el
// servidor no conoce localStorage, y así el primer render de cliente ya trae el
// valor bueno sin encadenar un re-render (que además el lint prohíbe).
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());
const suscribir = (f) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

// Las instantáneas se cachean porque useSyncExternalStore exige la MISMA
// referencia mientras no haya cambios; devolver un objeto nuevo cada vez es un
// bucle infinito de renders.
const cache = { abierto: null, historial: null };

function leerCrudo(clave, porDefecto) {
  try {
    return localStorage.getItem(clave) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

const snapAbierto = () => {
  if (cache.abierto === null) cache.abierto = leerCrudo(ABIERTO_KEY, "0");
  return cache.abierto;
};
const snapHistorial = () => {
  if (cache.historial === null) cache.historial = leerCrudo(HIST_KEY, "[]");
  return cache.historial;
};

function escribir(clave, valor) {
  if (clave === ABIERTO_KEY) cache.abierto = valor;
  else cache.historial = valor;
  try {
    localStorage.setItem(clave, valor);
  } catch { /* modo privado: la sesión funciona igual, solo no se recuerda */ }
  avisar();
}

// Solo existe donde lo sirve tu máquina; en el servidor, nunca.
const snapLocal = () =>
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

export function AsistenteProvider({ children }) {
  const localReal = useSyncExternalStore(suscribir, snapLocal, () => false);
  // El 404 del servidor también apaga el asistente: si la ruta no existe, no
  // tiene sentido seguir enseñando la barra.
  const [servidorDijoNo, setServidorDijoNo] = useState(false);
  const disponible = localReal && !servidorDijoNo;

  const abierto = useSyncExternalStore(suscribir, snapAbierto, () => "0") === "1";
  const historialRaw = useSyncExternalStore(suscribir, snapHistorial, () => "[]");
  const historial = useMemo(() => {
    try {
      const l = JSON.parse(historialRaw);
      return Array.isArray(l) ? l.slice(0, HIST_MAX) : [];
    } catch {
      return [];
    }
  }, [historialRaw]);

  const [mensajes, setMensajes] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  // El sessionId vive en una ref (lo lee `enviar` sin re-render), pero la lista
  // del historial necesita re-pintarse al cambiar, así que va también a estado.
  const [hiloActual, setHiloActual] = useState(null);
  const sessionRef = useRef(null);
  const abortRef = useRef(null);
  // Cuándo fue la última vez que hubo una persona: tecla, clic o toque. Se
  // manda con cada turno para que el servidor pueda comprobar que no está
  // hablando con un script. Ver lib/lineasRojas.js.
  const gestoRef = useRef(Date.now());
  // `reintentar` necesita llamar a `enviar`, que se define más abajo.
  const enviarRef = useRef(null);

  // Guarda (o actualiza) la conversación en curso. Se llama al cerrar cada
  // turno, así que un chat a medias tampoco se pierde.
  const guardar = useCallback((msgs, id) => {
    if (!id || !msgs?.length) return;
    const titulo = (msgs.find((m) => m.rol === "yo")?.texto || "Chat").slice(0, 80);
    let prev = [];
    try { prev = JSON.parse(snapHistorial()); } catch { prev = []; }
    const resto = (Array.isArray(prev) ? prev : []).filter((c) => c.id !== id);
    const lista = [{ id, titulo, ts: Date.now(), mensajes: msgs }, ...resto].slice(0, HIST_MAX);
    escribir(HIST_KEY, JSON.stringify(lista));
  }, []);

  const cambiarAbierto = useCallback((v) => {
    const prev = snapAbierto() === "1";
    const next = typeof v === "function" ? v(prev) : v;
    escribir(ABIERTO_KEY, next ? "1" : "0");
  }, []);

  const alternar = useCallback(() => cambiarAbierto((v) => !v), [cambiarAbierto]);

  const nueva = useCallback(() => {
    sessionRef.current = null;
    setHiloActual(null);
    setMensajes([]);
  }, []);

  // Retoma una conversación guardada: recupera los mensajes Y el sessionId, así
  // que el siguiente turno continúa el hilo real en Claude.
  const abrirChat = useCallback((chat) => {
    if (!chat) return;
    sessionRef.current = chat.id;
    setHiloActual(chat.id);
    setMensajes(chat.mensajes || []);
  }, []);

  const borrarChat = useCallback((id) => {
    let prev = [];
    try { prev = JSON.parse(snapHistorial()); } catch { prev = []; }
    escribir(HIST_KEY, JSON.stringify((Array.isArray(prev) ? prev : []).filter((c) => c.id !== id)));
    // Si borras la que estás mirando, la vista se queda en blanco: sería raro
    // seguir escribiendo en un hilo que acabas de tirar.
    if (sessionRef.current === id) {
      sessionRef.current = null;
      setMensajes([]);
    }
  }, []);

  const parar = useCallback(() => abortRef.current?.abort(), []);

  // Reintentar: quita el turno fallido y vuelve a mandar la misma pregunta.
  // Un error de red no debería obligar a reescribir lo que ya habías escrito.
  const reintentar = useCallback(() => {
    let pregunta = null;
    setMensajes((m) => {
      const i = m.length - 1;
      if (i < 1 || m[i].rol !== "claude" || m[i - 1].rol !== "yo") return m;
      pregunta = m[i - 1].texto;
      return m.slice(0, i - 1);
    });
    // Fuera del setState: enviar vuelve a tocar el mismo estado.
    setTimeout(() => { if (pregunta) enviarRef.current?.(pregunta); }, 0);
  }, []);

  const enviar = useCallback(async (pregunta) => {
    const limpio = String(pregunta || "").trim();
    if (!limpio || ocupado) return;

    setOcupado(true);
    setMensajes((m) => [...m, { rol: "yo", texto: limpio }, { rol: "claude", texto: "", pensando: true }]);

    // Siempre escribimos sobre el ÚLTIMO mensaje, el que acabamos de crear.
    const parchear = (patch) =>
      setMensajes((m) => {
        const copia = [...m];
        const i = copia.length - 1;
        if (i < 0) return m;
        copia[i] = { ...copia[i], ...patch };
        return copia;
      });

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let finalizado = null;

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: limpio,
          sessionId: sessionRef.current,
          gesto: Date.now() - gestoRef.current,
        }),
        signal: ctrl.signal,
      });

      if (res.status === 404) {
        setServidorDijoNo(true);
        setMensajes((m) => m.slice(0, -2));
        return;
      }
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        parchear({ pensando: false, error: j.error || `Error ${res.status}` });
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let resto = "";
      let acumulado = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        resto += dec.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() || "";
        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let ev;
          try {
            ev = JSON.parse(linea);
          } catch {
            continue;
          }
          if (ev.t === "texto") {
            acumulado += ev.v;
            parchear({ texto: acumulado, pensando: false, tool: null });
          } else if (ev.t === "tool") {
            parchear({ tool: ev.v, pensando: false });
          } else if (ev.t === "resultado") {
            // Red de seguridad: si no llegó ningún fragmento, usamos el final.
            if (!acumulado && ev.v) {
              acumulado = ev.v;
              parchear({ texto: acumulado, pensando: false, tool: null });
            }
          } else if (ev.t === "sugerencia") {
            parchear({ sugerencia: ev.v });
          } else if (ev.t === "error") {
            parchear({ pensando: false, error: ev.v });
          } else if (ev.t === "fin") {
            sessionRef.current = ev.sessionId;
            setHiloActual(ev.sessionId);
            parchear({ pensando: false, tool: null });
            finalizado = ev.sessionId;
          }
        }
      }
    } catch (e) {
      parchear({ pensando: false, tool: null, ...(e.name === "AbortError" ? {} : { error: e.message }) });
    } finally {
      setOcupado(false);
      abortRef.current = null;
      // `setMensajes` con función para leer el estado ya actualizado: aquí las
      // variables del closure aún tienen el hilo de antes del turno.
      const id = finalizado || sessionRef.current;
      setMensajes((m) => { guardar(m, id); return m; });
    }
  }, [ocupado, guardar]);

  enviarRef.current = enviar;

  // Cualquier interacción real cuenta como presencia. Van en `capture` y en el
  // documento entero para que valga también lo que ocurre dentro del chat.
  useEffect(() => {
    const marcar = () => { gestoRef.current = Date.now(); };
    const opts = { capture: true, passive: true };
    for (const ev of ["keydown", "pointerdown", "touchstart"]) {
      document.addEventListener(ev, marcar, opts);
    }
    return () => {
      for (const ev of ["keydown", "pointerdown", "touchstart"]) {
        document.removeEventListener(ev, marcar, opts);
      }
    };
  }, []);

  // ⌘J abre y cierra desde cualquier pantalla del portal.
  useEffect(() => {
    if (!disponible) return;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        alternar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disponible, alternar]);

  const valor = {
    disponible,
    abierto: disponible && abierto,
    abrir: () => cambiarAbierto(true),
    cerrar: () => cambiarAbierto(false),
    alternar,
    mensajes,
    ocupado,
    enviar,
    parar,
    nueva,
    reintentar,
    historial,
    hiloActual,
    abrirChat,
    borrarChat,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

// Fuera del provider (login, páginas públicas) devuelve un objeto inerte en vez
// de reventar: quien lo use solo verá que no está disponible.
const INERTE = {
  disponible: false, abierto: false,
  abrir() {}, cerrar() {}, alternar() {},
  mensajes: [], ocupado: false,
  enviar() {}, parar() {}, nueva() {}, reintentar() {},
  historial: [], hiloActual: null, abrirChat() {}, borrarChat() {},
};

export function useAsistente() {
  return useContext(Ctx) || INERTE;
}
