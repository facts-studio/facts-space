"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "@/lib/cn";

/**
 * Desplegable del sistema, sobre Radix (accesible, teclado, portal sin recortes)
 * con estilos F*cts. API por `options`:
 *   <Select value={v} onChange={setV} options={[{value,label}]} placeholder="…" />
 * onChange recibe el value (no el evento).
 */
export default function Select({ value, onChange, options = [], placeholder = "Seleccionar…", className, ariaLabel }) {
  const current = options.find((o) => o.value === value);
  return (
    <RadixSelect.Root value={value ?? ""} onValueChange={onChange}>
      <RadixSelect.Trigger
        aria-label={ariaLabel || placeholder}
        className={cn(
          "inline-flex items-center justify-between gap-2 h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-ink transition",
          "hover:border-borderStrong focus:outline-none focus-visible:border-brand/55 focus-visible:ring-2 focus-visible:ring-brand/15 data-[state=open]:border-borderStrong",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder}>{current?.label ?? placeholder}</RadixSelect.Value>
        <RadixSelect.Icon>
          <svg className="h-4 w-4 text-mutedSoft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-[80] min-w-[var(--radix-select-trigger-width)] max-h-[300px] overflow-hidden rounded-xl border border-border/60 bg-paper shadow-float"
        >
          <RadixSelect.Viewport className="p-1.5">
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className={cn(
                  "flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-[13px] text-ink outline-none cursor-pointer select-none",
                  "data-[highlighted]:bg-surface2/70 data-[state=checked]:font-medium"
                )}
              >
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <svg className="h-3.5 w-3.5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
