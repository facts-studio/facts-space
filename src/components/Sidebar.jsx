"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SECONDARY_NAV, FOOTER_NAV } from "@/lib/nav";
import { createClient } from "@/lib/supabase/client";
import FctsMark from "@/components/FctsMark";
import ThemeToggle from "@/components/ThemeToggle";
import NavIcon from "@/components/NavIcon";

function NavLink({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-[background-color,color] duration-150",
        active
          ? "bg-surface2 text-ink shadow-card"
          : "text-muted hover:text-ink hover:bg-surface2/60",
      ].join(" ")}
    >
      <span className={`shrink-0 ${active ? "opacity-100" : "opacity-70"}`}><NavIcon name={icon} /></span>
      {label}
    </Link>
  );
}

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const name = user?.user_metadata?.full_name || user?.email || "Equipo";
  const avatar = user?.user_metadata?.avatar_url;

  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 hidden md:flex flex-col border-r border-border px-4 py-6">
      <div className="px-3 mb-8 flex items-center gap-3">
        <FctsMark className="h-5 w-auto text-brand shrink-0" />
        <div>
          <p className="section-eyebrow mb-0.5">F*cts Studio</p>
          <p className="font-display text-[18px] text-ink leading-none">
            Portal <span className="title-italic">interno</span>
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-border flex flex-col gap-1">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>

      <nav className="mt-auto pt-6 flex flex-col gap-1">
        {FOOTER_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="pt-6">
        <div className="flex items-center gap-3 px-2">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
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
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
