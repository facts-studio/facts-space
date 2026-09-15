"use client";

// F*ctito como una barra flotante centrada, abajo de la pantalla.
//
// En reposo es una pastilla estrecha —una invitación, no un formulario—. Al
// pulsarla se ensancha y salen sus controles; al preguntar, el panel se
// despliega HACIA ARRIBA, sin cambiar de pantalla. Ese panel muestra la
// conversación o los chats guardados según lo que pidas: siempre en el mismo
// sitio, para no tener que buscar dónde salió la respuesta.
//
// Sustituye a la columna lateral: el asistente deja de robar ancho a la página
// y se pone donde no estorba, que en una pantalla de trabajo importa.
//
// Portado del panel de Adhōc (components/AsistenteHome.jsx), adaptado a los
// tokens y a los iconos de este portal.

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import Fantasma from "@/components/asistente/Fantasma";
import AsistenteChat from "@/components/asistente/AsistenteChat";
import { useAsistente } from "@/lib/asistente";
import { cn } from "@/lib/cn";
import { sonar, setSonido, suscribirSonido, snapSonido, snapSonidoServidor } from "@/lib/sonido";

const ATAJOS = ["¿Qué tengo esta semana?", "Resúmeme el estado de los sprints", "¿Quién está fuera?"];

// Iconos sueltos: son cinco y muy pequeños, no compensa una librería.
const Ico = ({ d, className = "h-4 w-4", fill = "none" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
const IcoReloj = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>} />;
const IcoMas = (p) => <Ico {...p} d={<path d="M12 5v14M5 12h14" />} />;
const IcoX = (p) => <Ico {...p} d={<path d="M6 6l12 12M18 6L6 18" />} />;
const IcoArriba = (p) => <Ico {...p} d={<path d="M12 19V5M5 12l7-7 7 7" />} />;
const IcoExpandir = (p) => <Ico {...p} d={<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />} />;
const IcoPlegar = (p) => <Ico {...p} d={<path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" />} />;
const IcoSonido = (p) => <Ico {...p} d={<><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5a3.5 3.5 0 0 1 0 5" /></>} />;
const IcoSilencio = (p) => <Ico {...p} d={<><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="m16 10 4 4M20 10l-4 4" /></>} />;

function cuando(ts) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

// Acciones secundarias: tonales y sin borde, para no competir con el campo.
function Chip({ icon, children, onClick, activo }) {
  return (
    <button
      type="button"
      // Sin esto, pulsar un chip le quita el foco al campo y la barra se
      // encoge justo cuando ibas a usarla.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-pressed={activo || undefined}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-micro whitespace-nowrap",
        "transition active:scale-95",
        activo ? "bg-ink/[0.08] text-ink" : "text-mutedSoft hover:bg-ink/[0.06] hover:text-ink"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export default function AsistenteBar() {
  const { disponible, mensajes, ocupado, enviar, parar, nueva, historial, hiloActual, abrirChat, borrarChat } = useAsistente();

  const [texto, setTexto] = useState("");
  const [panel, setPanel] = useState(null); // null | "hilo" | "historial"
  // «En uso» = el cursor está dentro. Es lo que ensancha la barra y saca los
  // controles: en reposo basta una línea que invite a escribir.
  const [enUso, setEnUso] = useState(false);
  // Pantalla completa: para leer una respuesta larga sin el hilo metido en una
  // caja de 420px. Se sale al plegar, es un modo puntual.
  const [completa, setCompleta] = useState(false);
  const taRef = useRef(null);
  const cajaRef = useRef(null);
  // La preferencia vive en localStorage; se lee con useSyncExternalStore para
  // no tener que sincronizarla con un efecto.
  const conSonido = useSyncExternalStore(suscribirSonido, snapSonido, snapSonidoServidor);
  const ocupadoPrevio = useRef(false);

  // El sonido de respuesta se dispara cuando F*ctito deja de pensar, que es el
  // único sitio donde se sabe que ha terminado (el envío ya suena al pulsar).
  useEffect(() => {
    if (ocupadoPrevio.current && !ocupado) {
      sonar(mensajes[mensajes.length - 1]?.error ? "error" : "respuesta");
    }
    ocupadoPrevio.current = ocupado;
  }, [ocupado, mensajes]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [texto]);

  // Clic fuera y Esc repliegan. No borran nada: la conversación sigue viva.
  useEffect(() => {
    if (!panel && !enUso) return;
    const plegar = () => { if (panel) sonar("cerrar"); setPanel(null); setEnUso(false); setCompleta(false); };
    const fuera = (e) => { if (!cajaRef.current?.contains(e.target)) plegar(); };
    // Esc sale primero de pantalla completa: es lo último que hiciste, y
    // cerrarlo todo de golpe obligaría a reabrir la conversación.
    const esc = (e) => { if (e.key === "Escape") completa ? setCompleta(false) : plegar(); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [panel, enUso, completa]);

  if (!disponible) return null;

  // Cerrar devuelve la barra a su tamaño de reposo. Que haya conversación no
  // la mantiene abierta: cerrar es cerrar, y el hilo sigue ahí para cuando
  // vuelvas a escribir.
  const plegarTodo = () => {
    if (panel) sonar("cerrar");
    setPanel(null);
    setCompleta(false);
    setEnUso(false);
    taRef.current?.blur();
  };
  const mandar = (v) => {
    const q = (v ?? texto).trim();
    if (!q || ocupado) return;
    setTexto("");
    setPanel("hilo");
    sonar("enviar");
    enviar(q);
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); mandar(); }
  };

  const panelVisible = panel;
  // Ancha solo mientras se usa: con el cursor dentro o con el panel desplegado.
  const abierta = enUso || Boolean(panelVisible);
  // La cara sigue al estado: concentrado mientras trabaja, triste si algo
  // falló, guiño mientras escribes, y sonriendo el resto del tiempo.
  const ultimo = mensajes[mensajes.length - 1];
  const cara = ocupado ? "funny" : ultimo?.error ? "sad" : texto.trim() ? "wink" : "smile";
  const puedeEnviar = Boolean(texto.trim());

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40",
        completa
          ? "inset-0 z-[60] flex flex-col bg-bg"
          // Se ancla a la izquierda al ancho de la barra lateral, así que queda
          // centrada con el CONTENIDO y no con la pantalla.
          : "inset-x-0 px-5 md:left-[var(--sidebar-w,0px)] md:px-8 bottom-[calc(env(safe-area-inset-bottom)_+_76px)] md:bottom-5"
      )}
    >
      <div
        ref={cajaRef}
        // Crece al usarla animando el ancho MÁXIMO, no el layout: la página de
        // detrás no se recoloca al abrirla.
        className={cn(
          "pointer-events-auto mx-auto w-full transition-[max-width] duration-300",
          completa ? "flex h-full max-w-none flex-col" : abierta ? "max-w-[800px]" : "max-w-[440px]"
        )}
        style={{ transitionTimingFunction: "var(--ease-drawer)" }}
      >
        {/* Panel de arriba: la conversación o los chats. Mismo marco para los
            dos — cambia el contenido, no el sitio donde aparece. */}
        {panelVisible && (
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              completa ? "min-h-0 flex-1 bg-bg" : "msg-in mb-2 h-[min(46vh,420px)] rounded-[22px] bg-paper shadow-float"
            )}
          >
            <div className={cn("flex h-11 shrink-0 items-center gap-2 pl-4 pr-2", completa ? "mx-auto w-full max-w-[760px] md:h-14" : "border-b border-border/40")}>
              {panelVisible === "historial"
                ? <IcoReloj className="h-4 w-4 shrink-0 text-mutedSoft" />
                : <Fantasma estado={cara} pensando={ocupado} className="h-[18px] w-[18px] shrink-0 text-inkSoft" />}
              <span className="text-[12.5px] font-medium text-ink">{panelVisible === "historial" ? "Chats" : "F*ctito"}</span>
              <div className="ml-auto flex items-center gap-0.5">
                {/* Sin «Nuevo» aquí: la barra de abajo ya lo tiene, y repetido
                    obliga a decidir cuál de los dos usar. */}
                <button
                  onClick={() => setCompleta((v) => !v)}
                  aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
                  title={completa ? "Salir de pantalla completa" : "Pantalla completa"}
                  className="hidden h-8 w-8 items-center justify-center rounded-lg text-mutedSoft transition hover:bg-ink/[0.06] hover:text-ink active:scale-95 md:inline-flex"
                >
                  {completa ? <IcoPlegar /> : <IcoExpandir />}
                </button>
                <button
                  onClick={plegarTodo}
                  aria-label="Plegar"
                  title="Plegar (Esc)"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mutedSoft transition hover:bg-ink/[0.06] hover:text-ink active:scale-95"
                >
                  <IcoX />
                </button>
              </div>
            </div>

            {/* `min-h-0` es lo que permite que el hijo desborde y tenga SU
                scroll. Sin él crecería sin límite y se movería la página. */}
            {panelVisible === "hilo" ? (
              <div className={cn("flex min-h-0 flex-1 flex-col px-4 py-3", completa && "mx-auto w-full max-w-[760px]")}>
                <AsistenteChat sinCompositor />
              </div>
            ) : (
              <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-2", completa && "mx-auto w-full max-w-[760px]")}>
                {historial.length === 0 ? (
                  <div className="px-2 py-3 text-micro leading-relaxed text-muted">
                    Los chats se guardan solos al responder. Aquí quedan los 10 últimos.
                  </div>
                ) : (
                  historial.map((c, i) => (
                    <div
                      key={c.id}
                      style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}
                      className={cn(
                        "msg-in group flex items-center gap-1 rounded-xl transition-colors",
                        c.id === hiloActual ? "bg-ink/[0.05]" : "hover:bg-ink/[0.04]"
                      )}
                    >
                      <button onClick={() => { abrirChat(c); setPanel("hilo"); }} className="min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left">
                        <div className="truncate text-small text-ink">{c.titulo}</div>
                        <div className="mt-0.5 text-micro text-mutedSoft">{cuando(c.ts)}</div>
                      </button>
                      <button
                        onClick={() => borrarChat(c.id)}
                        aria-label={`Borrar el chat «${c.titulo}»`}
                        title="Borrar"
                        className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-mutedSoft opacity-0 transition hover:bg-dangerSoft/50 hover:text-danger active:scale-95 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <IcoX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* La barra. Una sola caja: controles y campo comparten contenedor, con
            el radio de dentro = el de fuera menos su padding (22 − 6 = 16). */}
        <div className={cn("p-1.5", completa ? "mx-auto w-full max-w-[760px] shrink-0 pb-4" : "rounded-[22px] bg-paper shadow-float")}>
          <div className={cn("grid transition-[grid-template-rows,opacity] duration-300", abierta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1 overflow-x-auto px-1.5 pb-1.5 pt-1">
                <Chip icon={<IcoReloj className="h-3.5 w-3.5" />} activo={panel === "historial"} onClick={() => setPanel(panel === "historial" ? null : "historial")}>
                  Chats
                </Chip>
                {mensajes.length === 0
                  ? ATAJOS.map((a) => <Chip key={a} onClick={() => mandar(a)}>{a}</Chip>)
                  : <Chip icon={<IcoMas className="h-3.5 w-3.5" />} onClick={() => { sonar("nuevo"); nueva(); plegarTodo(); }}>Nuevo chat</Chip>}
                {/* Apagar el sonido vive junto al resto de controles y no en
                    ajustes: es una preferencia de esta barra y del momento
                    (una reunión, unos cascos puestos). */}
                <Chip
                  icon={conSonido ? <IcoSonido className="h-3.5 w-3.5" /> : <IcoSilencio className="h-3.5 w-3.5" />}
                  onClick={() => { const v = !conSonido; setSonido(v); if (v) sonar("abrir"); }}
                  activo={!conSonido}
                >
                  {conSonido ? "Sonido" : "Silencio"}
                </Chip>
              </div>
            </div>
          </div>

          <div className={cn("flex items-end gap-1.5 rounded-[16px] p-1.5 pl-3 transition-colors duration-300", abierta ? "bg-surface2/50 focus-within:bg-surface2/80" : "bg-transparent")}>
            <Fantasma estado={cara} pensando={ocupado} className={cn("mb-2 h-[18px] w-[18px] shrink-0 transition-colors", ocupado ? "text-inkSoft" : "text-mutedSoft")} />
            <textarea
              ref={taRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => { if (!enUso) sonar("abrir"); setEnUso(true); if (mensajes.length > 0) setPanel("hilo"); }}
              rows={1}
              placeholder="Pregunta lo que quieras…"
              className="min-w-0 flex-1 resize-none bg-transparent py-2 pl-1 text-small leading-[1.5] text-ink outline-none placeholder:text-mutedSoft"
            />
            {/* Mientras responde no se pinta un cuadro oscuro con un stop: se
                atenúa y gira un anillo. Parar es una salida, no la acción
                principal. */}
            <button
              type="button"
              onClick={() => (ocupado ? parar() : mandar())}
              disabled={!ocupado && !puedeEnviar}
              aria-label={ocupado ? "Parar" : "Preguntar"}
              title={ocupado ? "Parar" : "Preguntar"}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition active:scale-95",
                ocupado ? "bg-ink/[0.07] text-inkSoft hover:bg-ink/[0.12]" : puedeEnviar ? "bg-inkSoft text-paper hover:bg-ink" : "cursor-not-allowed text-mutedSoft/60"
              )}
            >
              {ocupado ? (
                <span className="relative grid h-[18px] w-[18px] place-items-center">
                  <span aria-hidden className="absolute inset-0 animate-spin rounded-full border-2 border-ink/[0.12] border-t-inkSoft/70" />
                  <span aria-hidden className="h-[7px] w-[7px] rounded-[2px] bg-inkSoft" />
                </span>
              ) : (
                <IcoArriba />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
