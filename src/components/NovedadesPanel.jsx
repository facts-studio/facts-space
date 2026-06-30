"use client";

import Link from "next/link";
import NavIcon from "@/components/NavIcon";

// Chip de icono por tono (clases explícitas para Tailwind).
const TONE = {
  brand: "bg-brandSoft text-brand",
  info: "bg-infoSoft text-info",
  warn: "bg-warnSoft text-warn",
  violet: "bg-violetSoft text-violet",
  success: "bg-successSoft text-success",
};

function Item({ tone, icon, tag, title, sub, cta, to }) {
  const inner = (
    <>
      <div className="flex items-center gap-2.5">
        <span className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${TONE[tone] || TONE.brand}`}>
          <NavIcon name={icon} className="w-[18px] h-[18px]" />
        </span>
        {tag && (
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-mutedSoft">
            {tag}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-body font-semibold text-ink leading-snug">{title}</div>
        {sub && <div className="text-micro text-mutedSoft mt-1 leading-snug">{sub}</div>}
      </div>
      {cta && (
        <div className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-between text-micro text-muted group-hover:text-ink transition">
          <span>{cta}</span>
          <span className="-translate-x-0.5 group-hover:translate-x-0 transition-transform">→</span>
        </div>
      )}
    </>
  );
  const cls =
    "group block w-full text-left rounded-2xl bg-surface2/65 border border-border/45 p-4 hover:bg-surface2/90 transition-colors";
  return to ? (
    <Link href={to} className={cls}>{inner}</Link>
  ) : (
    <div className={cls.replace("hover:bg-surface2/90", "")}>{inner}</div>
  );
}

export default function NovedadesPanel({ news = [] }) {
  // De momento, solo 3 novedades de ejemplo.
  const items = news.slice(0, 3);

  return (
    <aside className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto overscroll-contain space-y-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-caption uppercase tracking-[0.16em] text-mutedSoft">Novedades</span>
        <span className="text-caption text-mutedSoft tabular-nums">{items.length}</span>
      </div>
      {items.map((it) => (
        <Item key={it.id} {...it} />
      ))}
    </aside>
  );
}
