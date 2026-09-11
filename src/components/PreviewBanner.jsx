"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPreviewRole } from "@/lib/actions/preview";

// Banda fija mientras un admin mira el portal como otro tipo de usuario. Va
// arriba, ocupando todo el ancho y en negro: hay que ser imposible de ignorar,
// porque desde dentro el portal parece el de otra persona (Administrar
// desaparece) y sin esto se piensa que algo se ha roto.
export default function PreviewBanner({ label }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const salir = () =>
    start(async () => {
      await setPreviewRole(null);
      router.push("/admin?tab=equipo");
      router.refresh();
    });

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-ink text-bg px-4 py-1.5 text-[12.5px]">
      {/* Eye de MynaUI (mynaui.com/icons) */}
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 opacity-80" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3.275 12.417a1 1 0 0 1 0-.834C4.783 8.318 8.13 6 12 6s7.217 2.318 8.725 5.583a1 1 0 0 1 0 .834C19.217 15.682 15.87 18 12 18s-7.217-2.318-8.725-5.583Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
      <span className="truncate">
        Estás viendo el portal como <span className="font-medium">{label}</span>
      </span>
      <button
        onClick={salir}
        disabled={pending}
        className="shrink-0 rounded-md bg-bg/15 hover:bg-bg/25 px-2 py-0.5 transition disabled:opacity-50"
      >
        {pending ? "Saliendo…" : "Salir"}
      </button>
    </div>
  );
}
