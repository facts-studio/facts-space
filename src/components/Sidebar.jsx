"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { createClient } from "@/lib/supabase/client";
import { setNavCollapsed } from "@/lib/actions/prefs";
import FctsMark from "@/components/FctsMark";
import ThemeToggle from "@/components/ThemeToggle";
import NavIcon from "@/components/NavIcon";

// Icono de "barra lateral" (estilo ChatGPT): panel con divisoria.
const PanelIcon = ({ className = "h-[18px] w-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2.5" /><line x1="9.5" y1="4" x2="9.5" y2="20" />
  </svg>
);

function NavLink({ href, label, icon, active, collapsed }) {
  return (
    <Link
      href={href}
      className={[
        "group/nav relative flex items-center rounded-xl text-[14px] transition-[background-color,color] duration-150",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
        active
          ? "bg-surface2 text-ink shadow-card"
          : "text-muted hover:text-ink hover:bg-surface2/60",
      ].join(" ")}
    >
      <span className={`shrink-0 ${active ? "opacity-100" : "opacity-70"}`}><NavIcon name={icon} /></span>
      {!collapsed && label}
      {/* Menú recogido: burbuja con el nombre de la acción al pasar el ratón. */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-full bg-surface2 border border-border/70 px-3 py-1 text-[12px] text-ink opacity-0 transition-opacity group-hover/nav:opacity-100 z-50">
          {label}
        </span>
      )}
    </Link>
  );
}

function SubLink({ href, label, active }) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center pl-[38px] pr-3 py-1.5 rounded-lg text-[13px] transition-[background-color,color] duration-150",
        active ? "text-ink font-medium" : "text-mutedSoft hover:text-ink hover:bg-surface2/60",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function Sidebar({ user, isAdmin = false, serverTheme = null, initialCollapsed = false }) {
  const pathname = usePathname();
  // Estado recordado EN EL USUARIO (employees.nav_collapsed): el SSR ya llega
  // con el valor correcto (prop), así que no hay parpadeo de ancho.
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      setNavCollapsed(next);
      return next;
    });

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  // Los sub-items con ancla (#) no se marcan activos; los de ruta real, sí.
  const childActive = (href) =>
    !href.includes("#") && pathname.startsWith(href.split("#")[0]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const name = user?.user_metadata?.full_name || user?.email || "Equipo";
  const avatar = user?.user_metadata?.avatar_url;

  return (
    <aside
      suppressHydrationWarning
      className={[
        "shrink-0 h-screen sticky top-0 hidden md:flex flex-col border-r border-border py-6 transition-[width] duration-200 ease-out",
        collapsed ? "w-[76px] px-3" : "w-[248px] px-4",
      ].join(" ")}
    >
      {/* Cabecera — logo + nombre fusionados con recoger/expandir (estilo ChatGPT) */}
      {collapsed ? (
        // Recogido: el logo ES el botón; al pasar el ratón se convierte en el
        // icono de barra lateral + tooltip "Abrir barra lateral".
        <button
          onClick={toggle}
          aria-label="Abrir barra lateral"
          className="group/toggle relative mb-4 mx-auto h-9 w-9 grid place-items-center rounded-lg hover:bg-surface2/60 transition"
        >
          <FctsMark className="h-5 w-auto text-brand transition-opacity group-hover/toggle:opacity-0" />
          <span className="absolute inset-0 grid place-items-center text-inkSoft opacity-0 transition-opacity group-hover/toggle:opacity-100">
            <PanelIcon />
          </span>
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-full bg-surface2 border border-border/70 px-3 py-1 text-[12px] text-ink opacity-0 transition-opacity group-hover/toggle:opacity-100 z-50">
            Abrir barra lateral
          </span>
        </button>
      ) : (
        <div className="mb-4 flex items-center gap-3 px-1">
          <FctsMark className="h-5 w-auto text-brand shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-[18px] text-ink leading-none">F*cts Studio</p>
          </div>
          <button
            onClick={toggle}
            title="Cerrar barra lateral"
            aria-label="Cerrar barra lateral"
            className="shrink-0 h-8 w-8 grid place-items-center rounded-lg text-mutedSoft hover:text-ink hover:bg-surface2/60 transition"
          >
            <PanelIcon />
          </button>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {NAV_GROUPS.map((group, gi) => (
          <div
            key={gi}
            className={`flex flex-col gap-1 ${gi > 0 ? "mt-3 pt-3 border-t border-border/70" : ""}`}
          >
            {group.map((item) => (
              <div key={item.href}>
                <NavLink {...item} active={isActive(item.href)} collapsed={collapsed} />
                {!collapsed && item.children && (
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {item.children.map((c) => (
                      <SubLink key={c.href} href={c.href} label={c.label} active={childActive(c.href)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <nav className="mt-auto pt-6 flex flex-col gap-1">
        {isAdmin && (
          <NavLink href="/admin" label="Administrar" icon="settings" active={isActive("/admin")} collapsed={collapsed} />
        )}
      </nav>

      {/* Usuario */}
      <div className="pt-6">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" title={name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div title={name} className="w-8 h-8 rounded-full bg-brandSoft text-brand grid place-items-center text-[13px]">
                {name[0]?.toUpperCase()}
              </div>
            )}
            <ThemeToggle serverTheme={serverTheme} />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brandSoft text-brand grid place-items-center text-[13px]">
                {name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-small text-ink truncate">{name}</p>
              {process.env.NEXT_PUBLIC_AUTH_DISABLED === "true" ? (
                <span className="text-micro text-mutedSoft">Modo preview</span>
              ) : (
                <button
                  onClick={signOut}
                  className="text-micro text-mutedSoft hover:text-ink transition"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
            <ThemeToggle serverTheme={serverTheme} />
          </div>
        )}
      </div>
    </aside>
  );
}
