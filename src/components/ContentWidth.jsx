"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Ancho del contenido del portal. Por defecto TODAS las pantallas van al mismo
 * ancho centrado que Inicio (max-w-4xl) para que la lectura sea consistente.
 *
 * Excepciones a ancho completo: las vistas que son una rejilla o una tabla y
 * se ahogan en una columna estrecha (el tablero de Tareas, el mes del Calendario
 * y las rejillas de Recursos). Se comparan por prefijo, así que sus subrutas
 * heredan — "/recursos" cubre Programas, Websites y sus fichas.
 */
const ANCHO_COMPLETO = ["/tareas", "/calendario", "/recursos"];
// A sangre: pantallas que ocupan de borde a borde y anulan el padding del
// layout (el cronograma necesita cada píxel de ancho para su línea de tiempo).
const A_SANGRE = ["/cronograma"];

export default function ContentWidth({ children, className }) {
  const pathname = usePathname() || "/";
  const dentro = (list) => list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const sangre = dentro(A_SANGRE);
  const full = dentro(ANCHO_COMPLETO);
  // Sin `mx-auto` ni `w-full` en el caso a sangre: `cn` no resuelve conflictos
  // de Tailwind, así que conviven con los márgenes negativos y ganan ellos.
  const ancho = sangre
    ? "w-auto -mx-5 md:-mx-10"
    : full
      ? "mx-auto w-full max-w-[1440px]"
      : "mx-auto w-full max-w-4xl";
  return (
    <div className={cn("fade-up pt-8 md:pt-0", ancho, className)}>
      {children}
    </div>
  );
}
