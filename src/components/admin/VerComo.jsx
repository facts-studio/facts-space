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
    <div className={cn("rounded-3xl bg-surface2/40 p-3", className)}>
      <p className="section-eyebrow px-2 pt-2 pb-3">Ver el portal como…</p>
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
