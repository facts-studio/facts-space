"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NAV_GROUPS } from "@/lib/nav";
import NavIcon from "@/components/NavIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

// Destinos principales de la barra inferior (patrón app nativa: 4 + "Más").
const TABS = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/tareas", label: "Tareas", icon: "tasks" },
  { href: "/calendario", label: "Agenda", icon: "calendar" },
  { href: "/mi-espacio", label: "Espacio", icon: "user" },
];

// El resto de secciones vive en la hoja "Más" (todas menos las de la barra).
const TAB_HREFS = new Set(TABS.map((t) => t.href));

function TabLink({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      className={cn(
        "press flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl",
        active ? "text-ink" : "text-mutedSoft"
      )}
    >
      <NavIcon name={icon} className="w-[22px] h-[22px]" />
      <span className="text-[10px] leading-none font-medium tracking-tight">{label}</span>
    </Link>
  );
}

// Hoja inferior con el resto de secciones + tema + logout.
function MoreSheet({ open, onClose, isAdmin, serverTheme }) {
  const pathname = usePathname();
  // Los items con `children` no navegan (son solo contenedores): en la hoja se
  // sustituyen por lo que contienen, que sí son destinos reales.
  const items = NAV_GROUPS.flat()
    .flatMap((i) => i.children ?? [i])
    .filter((i) => !TAB_HREFS.has(i.href));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className={cn("md:hidden fixed inset-0 z-[70]", open ? "" : "pointer-events-none")}>
      {/* Velo */}
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/25 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
      />
      {/* Hoja */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface border-t border-border/60 pb-safe",
          "transition-transform duration-300 [transition-timing-function:var(--ease-drawer)]",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="grid place-items-center pt-2.5 pb-1">
          <span className="h-1 w-9 rounded-full bg-borderStrong/70" />
        </div>
        <div className="px-4 pt-2 pb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="section-eyebrow">Más</p>
            <ThemeToggle serverTheme={serverTheme} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {items.map((it) => {
              const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={onClose}
                  className={cn(
                    "press flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-surface2/50",
                    active ? "text-ink ring-1 ring-borderStrong" : "text-inkSoft"
                  )}
                >
                  <NavIcon name={it.icon} className="w-[20px] h-[20px]" />
                  <span className="text-[11.5px] leading-none">{it.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className={cn(
                  "press flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-surface2/50",
                  pathname.startsWith("/admin") ? "text-ink ring-1 ring-borderStrong" : "text-inkSoft"
                )}
              >
                <NavIcon name="settings" className="w-[20px] h-[20px]" />
                <span className="text-[11.5px] leading-none">Admin</span>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={signOut}
            className="press mt-3 w-full h-11 rounded-2xl bg-surface2/50 text-small text-mutedSoft hover:text-ink transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileNav({ isAdmin = false, serverTheme = null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // "Más" resalta cuando estás en una sección que no es de la barra.
  const inMore = !TABS.some((t) => isActive(t.href));

  return (
    <>
      {/* Barra flotante: despegada de los bordes, por encima de la safe-area. */}
      <nav
        className="md:hidden fixed inset-x-4 z-[60] mx-auto max-w-sm"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="flex items-stretch h-[58px] px-1.5 rounded-[26px] bg-surface/85 backdrop-blur-xl shadow-float">
          {TABS.map((t) => (
            <TabLink key={t.href} {...t} active={isActive(t.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "press flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-[20px]",
              inMore ? "text-ink" : "text-mutedSoft"
            )}
          >
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></svg>
            <span className="text-[10px] leading-none font-medium tracking-tight">Más</span>
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} isAdmin={isAdmin} serverTheme={serverTheme} />
    </>
  );
}
