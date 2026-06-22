"use client";

import { forwardRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

/** Brand-themed on/off toggle built on Radix Switch. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, disabled, id, className, ...rest },
  ref,
) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={rest["aria-label"]}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand-strong data-[state=checked]:bg-brand data-[state=unchecked]:border-line data-[state=unchecked]:bg-muted",
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-panel shadow-[0_1px_3px_rgba(26,25,22,0.35)] ring-1 ring-ink/15 transition-transform data-[state=checked]:translate-x-5.5" />
    </SwitchPrimitive.Root>
  );
});
