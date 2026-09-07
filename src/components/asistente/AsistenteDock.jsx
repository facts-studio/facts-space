"use client";

// Columna de F*ctito, anclada a la derecha y disponible en cualquier pantalla
// del portal.
//
// En escritorio se abre sobre la derecha de la pantalla; en móvil, como una
// hoja a pantalla completa. Así puedes mirar un sprint mientras preguntas por
// él, que es justo para lo que sirve.
//
// En móvil no hay sitio para dos columnas, así que se comporta como una hoja a
// pantalla completa.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Fantasma from "@/components/asistente/Fantasma";
import AsistenteChat from "@/components/asistente/AsistenteChat";
import { useAsistente } from "@/lib/asistente";

// Iconos de la cabecera, en línea (este proyecto no tiene un set <Icon>).
const ICONOS = {
  plus: <path d="M12 5v14M5 12h14" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  expand: <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />,
  collapse: <path d="M3 8h3a2 2 0 0 0 2-2V3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M21 16h-3a2 2 0 0 0-2 2v3" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  trash: <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></>,
};

function Icon({ name, className = "h-4 w-4", ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className} {...rest}>
      {ICONOS[name]}
    </svg>
  );
}

export const DOCK_W = 380;

// «hace 5 min», «ayer»… Fechas relativas cortas: en una lista de 10 líneas
// importa el orden, no la hora exacta.
function cuando(ts) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

// Botón de cabecera. Con `texto` se muestra la palabra; sin él, solo el icono.
//
// El criterio: llevan palabra las acciones que NO se adivinan por el dibujo
// (empezar de cero, ver las anteriores). Se quedan en icono solo las de
// ventana — expandir y cerrar — que son universales y además conviene que
// pesen poco: son las que menos vas a usar.
function BotonCabecera({ icon, texto, label, onClick, activo = false, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label || texto}
      title={label || texto}
      aria-pressed={activo || undefined}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg
        ${texto ? "px-2.5" : "w-8"}
        transition duration-150 ease-[var(--ease-out)] active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20
        disabled:pointer-events-none disabled:opacity-30
        ${activo ? "bg-ink/[0.08] text-ink" : "text-mutedSoft hover:bg-ink/[0.06] hover:text-ink"}
        ${className}`}
    >
      <Icon name={icon} className={texto ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {texto && <span className="text-[12px] font-medium">{texto}</span>}
    </button>
  );
}

function Historial({ chats, onAbrir, onBorrar, onNuevo, actual }) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Empezar de cero vive DENTRO del desplegable, arriba del todo: es la
          misma decisión que elegir un chat guardado — «en cuál escribo» — así
          que va en el mismo sitio en vez de ocupar un botón aparte. */}
      <button
        onClick={onNuevo}
        className="mb-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left
          transition duration-150 ease-[var(--ease-out)] hover:bg-ink/[0.05] active:scale-[0.99]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06]">
          <Icon name="plus" className="h-3.5 w-3.5 text-inkSoft" />
        </span>
        <span className="text-small font-medium text-ink">Nuevo chat</span>
      </button>

      {chats.length > 0 && (
        <div className="px-2.5 pb-1 pt-2 text-caption uppercase tracking-[0.08em] text-mutedSoft">
          Últimos
        </div>
      )}

      {chats.length === 0 && (
        <div className="px-2.5 py-2 text-caption leading-relaxed text-muted">
          Los chats se guardan solos al responder. Aquí se quedan los 10 últimos.
        </div>
      )}

      <div className="space-y-0.5">
        {chats.map((c, i) => {
          const abierta = c.id === actual;
          return (
            <div
              key={c.id}
              // Escalonado: la lista entra en cascada al abrirla.
              style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}
              className={`msg-in group flex items-start gap-1 rounded-xl transition-colors duration-150 ${
                abierta ? "bg-ink/[0.05]" : "hover:bg-ink/[0.04]"
              }`}
            >
              <button
                onClick={() => onAbrir(c)}
                className="min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
              >
                <div className="line-clamp-2 text-small leading-snug text-ink">{c.titulo}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-caption text-mutedSoft">
                  <span>{cuando(c.ts)}</span>
                  {abierta && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="text-inkSoft">abierto</span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={() => onBorrar(c.id)}
                aria-label={`Borrar el chat «${c.titulo}»`}
                title="Borrar"
                className="mt-1.5 mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                  text-mutedSoft opacity-0 transition duration-150 ease-[var(--ease-out)]
                  hover:bg-dangerSoft/50 hover:text-danger active:scale-95
                  group-hover:opacity-100 focus-visible:opacity-100
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AsistenteDock() {
  const {
    disponible,
    abierto,
    abrir,
    cerrar,
    nueva,
    mensajes,
    historial,
    hiloActual,
    abrirChat,
    borrarChat,
  } = useAsistente();
  const [historialAbierto, setVerHistorial] = useState(false);
  const pathname = usePathname();
  // En el login no hay portal al que preguntar.
  const enLogin = pathname?.startsWith("/login");
  const [anchoAbierto, setAncho] = useState(false); // pantalla completa

  // Con el panel cerrado, historial y pantalla completa se dan por plegados: el
  // estado de reposo de F*ctito es la columna. La pantalla completa es algo
  // puntual, para una respuesta larga, no un modo en el que quedarse — si se
  // recordara, volverías al portal y te lo encontrarías tapado sin pedirlo.
  // Se DERIVA en vez de resetearse al cerrar: un efecto que hace setState aquí
  // encadenaría un render de más cada vez que se cierra.
  const verHistorial = abierto && historialAbierto;
  const ancho = abierto && anchoAbierto;

  const alternarAncho = () => setAncho((v) => !v);

  // El título es la primera cosa que preguntaste. Sin nada aún, «Chats»: es el
  // nombre del desplegable que abre, no el de la acción que hay dentro — decir
  // «Nuevo chat» aquí chocaba con el «Nuevo chat» del propio menú.
  const primera = mensajes.find((m) => m.rol === "yo")?.texto;
  const tituloHilo = primera || "Chats";

  // Esc cierra, pero solo si no hay nada más encima (un modal se cierra antes).
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  if (!disponible) return null;

  return (
    <>
      {/* Lanzador flotante. Está aquí y no en la cabecera de AppShell a
          propósito: hay pantallas con `noHeader` (la Agenda) que se quedarían
          sin botón. Flotando, está en todas. En móvil sube para no chocar con
          la cápsula de navegación. */}
      {!enLogin && (
      <button
        onClick={abrir}
        aria-label="Abrir F*ctito"
        title="F*ctito (⌘J)"
        className={`fixed right-4 md:right-5 z-50 h-11 w-11 rounded-full bg-paper border border-border/60 shadow-float
          flex items-center justify-center text-inkSoft
          bottom-[calc(env(safe-area-inset-bottom)_+_88px)] md:bottom-6
          transition duration-200 hover:text-ink hover:bg-surface2/70 active:scale-95
          ${abierto ? "opacity-0 pointer-events-none translate-x-2" : "opacity-100"}`}
      >
        <Fantasma estado="smile" className="h-[20px] w-[20px]" />
      </button>
      )}

      {/* Móvil: fondo oscurecido, porque ahí sí tapa el contenido */}
      <div
        onClick={cerrar}
        aria-hidden
        className={`md:hidden fixed inset-0 z-[55] bg-ink/20 backdrop-blur-[2px] transition-opacity duration-200 ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        aria-hidden={!abierto}
        className={`fixed right-0 top-0 z-[56] h-svh flex flex-col bg-paper border-l border-border/60
          w-full ${ancho ? "md:w-full md:border-l-0" : "md:w-[380px]"}
          will-change-transform
          ${abierto
            ? "translate-x-0 transition-[transform,width] duration-[280ms] ease-[var(--ease-drawer)]"
            : "translate-x-full transition-transform duration-200 ease-[var(--ease-out)]"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <header className="shrink-0 h-12 flex items-center border-b border-border/50 px-4">
          <div
            className={`flex w-full items-center gap-2 transition-[padding] duration-300 ease-[var(--ease-out)] ${
              ancho ? "md:px-[6vw] xl:px-[9vw]" : ""
            }`}
          >
            {/* El título ES el acceso al historial. Deja de ser un rótulo
                muerto: dice en qué conversación estás y, al pulsarlo, despliega
                las anteriores. Se ahorra un icono en la fila y el sitio donde
                se cambia de hilo es el sitio donde se lee cuál es. */}
            <button
              onClick={() => setVerHistorial((v) => !v)}
              aria-expanded={verHistorial}
              aria-label={verHistorial ? "Volver al chat" : "Cambiar de chat"}
              title={verHistorial ? "Volver al chat" : "Ver los últimos chats"}
              className="-ml-1.5 flex min-w-0 items-center gap-2 rounded-lg py-1 pl-1.5 pr-2
                transition duration-150 ease-[var(--ease-out)] hover:bg-ink/[0.06]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              {/* El icono sigue al texto: reloj cuando el rótulo es «Chats»
                  (lista o sin hilo abierto), destello cuando lo que se lee es
                  el título de una conversación concreta. */}
              {verHistorial || !primera
                ? <Icon name="clock" className="h-4 w-4 shrink-0 text-mutedSoft" />
                : <Fantasma estado="smile" className="h-[18px] w-[18px] shrink-0 text-mutedSoft" />}
              <span className="truncate text-[12.5px] font-medium text-ink">
                {verHistorial ? "Chats" : tituloHilo}
              </span>
              <Icon
                name="chevron-right"
                aria-hidden
                className={`h-3.5 w-3.5 shrink-0 text-mutedSoft transition-transform duration-200 ease-[var(--ease-out)] ${
                  verHistorial ? "-rotate-90" : "rotate-90"
                }`}
              />
            </button>

            {/* A la derecha solo quedan las acciones de VENTANA. Lo que toca a
                los chats —crear y cambiar— vive todo en el desplegable de la
                izquierda, que es donde se lee en cuál estás. */}
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <BotonCabecera
                icon={ancho ? "collapse" : "expand"}
                label={ancho ? "Salir de pantalla completa" : "Pantalla completa"}
                onClick={alternarAncho}
                className="hidden md:inline-flex"
              />
              <BotonCabecera icon="x" label="Cerrar · Esc" onClick={cerrar} />
            </div>
          </div>
        </header>

        {/* Fluido: al expandir, el contenido usa el ancho disponible con
            márgenes proporcionales a la pantalla, en vez de quedarse clavado en
            una columna estrecha centrada que deja media pantalla vacía. */}
        <div
          className={`flex-1 min-h-0 pt-4 pb-3 w-full transition-[padding] duration-300 ease-out ${
            ancho ? "px-5 md:px-[6vw] xl:px-[9vw]" : "px-4"
          }`}
        >
          {verHistorial ? (
            <Historial
              chats={historial}
              onAbrir={(c) => {
                abrirChat(c);
                setVerHistorial(false);
              }}
              onBorrar={borrarChat}
              onNuevo={() => { nueva(); setVerHistorial(false); }}
              actual={hiloActual}
            />
          ) : (
            /* Se monta solo cuando está abierto: así el textarea coge el foco al
               abrir y no hay un chat vivo detrás consumiendo nada. */
            abierto && <AsistenteChat autoFocus />
          )}
        </div>
      </aside>
    </>
  );
}
