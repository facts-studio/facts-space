"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui";

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

  return (
    <Switch
      checked={mostrar}
      onChange={cambiar}
      label="Adhōc"
      className="text-micro text-mutedSoft"
    />
  );
}
