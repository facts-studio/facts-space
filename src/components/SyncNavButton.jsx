"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncIntegrations } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";

// Refrescar lo que viene de fuera sin entrar a Administrar: tira la caché de
// ClickUp y Slack, vuelve a traer la estructura de listas y vincula por email
// los perfiles de Slack que falten. Comparte la fila con los enlaces de la
// barra (mismas medidas y misma burbuja al estar recogida) para que no parezca
// una pieza pegada.
export default function SyncNavButton({ collapsed = false, className = "" }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  const sync = () =>
    start(async () => {
      setMsg(null);
      const r = await syncIntegrations();
      setMsg(r.ok ? r.text : r.error);
      if (r.ok) router.refresh();
      setTimeout(() => setMsg(null), 4000);
    });

  const label = pending ? "Sincronizando…" : msg || "Sincronizar ClickUp y Slack";

  return (
    <button
      type="button"
      onClick={sync}
      disabled={pending}
      title={label}
      className={cn(
        "group/nav relative flex items-center rounded-xl text-[14px] transition-[background-color,color] duration-150 text-muted hover:text-ink hover:bg-surface2/60 disabled:opacity-60",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5 w-full",
        className
      )}
    >
      <span className="shrink-0 opacity-70">
        {/* Refresh de MynaUI (mynaui.com/icons) */}
        <svg viewBox="0 0 24 24" className={cn("h-[18px] w-[18px]", pending && "animate-spin")} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.5 8c-1.392-3.179-4.823-5-8.522-5C7.299 3 3.453 6.552 3 11.1" />
          <path d="M16.489 8.4h3.97A.54.54 0 0 0 21 7.86V3.9M3.5 16c1.392 3.179 4.823 5 8.522 5 4.679 0 8.525-3.552 8.978-8.1" />
          <path d="M7.511 15.6h-3.97a.54.54 0 0 0-.541.54v3.96" />
        </svg>
      </span>
      {!collapsed && <span className="truncate">{pending ? "Sincronizando…" : "Sincronizar"}</span>}
      {/* Recogida: burbuja con el estado, igual que los enlaces de al lado. */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-full bg-surface2 border border-border/70 px-3 py-1 text-[12px] text-ink opacity-0 transition-opacity group-hover/nav:opacity-100 z-50">
          {label}
        </span>
      )}
    </button>
  );
}
