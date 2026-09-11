"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { setPreviewRole } from "@/lib/actions/preview";
import { cn } from "@/lib/cn";

// Mirar el portal con los permisos de otro tipo de usuario. Sirve para revisar
// qué ve cada uno —qué secciones, qué pestañas de Mi espacio— sin pedirle la
// pantalla a nadie ni inventarse cuentas de prueba.
const OPCIONES = [
  ["interno", "Compañero de plantilla", "Todo menos Administrar: con fichaje, nóminas y ficha laboral."],
  ["externo", "Colaborador externo", "Sin fichaje ni datos laborales; solo lo compartido."],
];

export default function VerComo({ className }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ver = (role) =>
    start(async () => {
      const r = await setPreviewRole(role);
      if (!r.ok) { alert(r.error); return; }
      router.push("/");
      router.refresh();
    });

  return (
    <div className={cn("rounded-2xl bg-surface2/40 p-5", className)}>
      <p className="section-eyebrow mb-1">Ver el portal como…</p>
      <p className="text-small text-muted mb-4 max-w-[70ch]">
        Entra en el portal con los permisos de otro tipo de usuario para comprobar qué ve.
        Cambian los permisos y la navegación, no los datos: sigues viendo tus propias ausencias
        y fichajes, y puedes salir cuando quieras desde el aviso de arriba.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPCIONES.map(([role, label, hint]) => (
          <div key={role} className="rounded-xl bg-surface p-4 flex flex-col gap-2">
            <p className="text-small text-ink">{label}</p>
            <p className="text-micro text-mutedSoft leading-snug flex-1">{hint}</p>
            <Button variant="ghost" size="sm" onClick={() => ver(role)} disabled={pending} className="w-fit">
              {pending ? "Entrando…" : "Ver así"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
