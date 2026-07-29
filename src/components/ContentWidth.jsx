"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Ancho del contenido del portal. Por defecto TODAS las pantallas van al mismo
 * ancho centrado que Inicio (max-w-4xl) para que la lectura sea consistente.
 *
 * Excepciones a ancho completo: las vistas que son una rejilla o una tabla y
 * se ahogan en una columna estrecha (el tablero de Tareas y el mes del
 * Calendario). Se comparan por prefijo, así que sus subrutas heredan.
 */
const ANCHO_COMPLETO = ["/tareas", "/calendario", "/recursos/websites"];

export default function ContentWidth({ children, className }) {
  const pathname = usePathname() || "/";
  const full = ANCHO_COMPLETO.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <div className={cn("fade-up mx-auto w-full pt-8 md:pt-0", full ? "max-w-[1440px]" : "max-w-4xl", className)}>
      {children}
    </div>
  );
}
