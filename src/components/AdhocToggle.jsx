"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

// Ver o no el trabajo de Adhōc (los clientes propios del estudio) mezclado con
// el del equipo. Vive en la URL y no en el estado del componente: así el
// servidor puede dejar de mandar esos datos —en vez de pintarlos y esconderlos—
// y la elección sobrevive a recargar.
export default function AdhocToggle({ mostrar = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const cambiar = (v) => {
    const next = new URLSearchParams(params);
    if (v) next.delete("adhoc"); else next.set("adhoc", "0"); // verlo es lo normal
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Un botón que se enciende, no un interruptor con etiqueta: comparte caja y
  // altura con el de recargar, que es su vecino, y no roba dos huecos de la
  // cabecera para decir una sola cosa.
  return (
    <button
      type="button"
      onClick={() => cambiar(!mostrar)}
      aria-pressed={mostrar}
      title={mostrar ? "Ocultar el trabajo de Adhōc" : "Ver también el trabajo de Adhōc"}
      className={cn(
        "h-8 px-2.5 grid place-items-center rounded-lg text-[12.5px] transition",
        mostrar ? "bg-ink text-bg" : "bg-surface2/70 text-mutedSoft hover:text-ink hover:bg-surface2"
      )}
    >
      Adhōc
    </button>
  );
}
