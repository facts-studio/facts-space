"use client";

import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

/**
 * Interruptor on/off del sistema, sobre Radix (comportamiento sólido/accesible)
 * con estilos F*cts: track ink al activar, crema al apagar; pulgar que desliza.
 * Uso: <Switch checked={v} onChange={setV} label="Cerradas" />
 */
export default function Switch({ checked, onChange, label, className, id }) {
  const control = (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      className={cn(
        "inline-flex items-center h-5 w-9 shrink-0 rounded-full px-0.5 transition-colors outline-none",
        "data-[state=checked]:bg-ink data-[state=unchecked]:bg-surface2",
        "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      )}
    >
      <RadixSwitch.Thumb
        className={cn(
          "block h-4 w-4 rounded-full bg-bg shadow-sm transition-transform will-change-transform",
          "translate-x-0 data-[state=checked]:translate-x-4"
        )}
      />
    </RadixSwitch.Root>
  );
  if (!label) return control;
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer select-none", className)}>
      <span className="text-micro text-mutedSoft whitespace-nowrap">{label}</span>
      {control}
    </label>
  );
}
