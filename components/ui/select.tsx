"use client";

import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

/** Brand-themed dropdown built on Radix Select. */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onValueChange, options, placeholder, disabled, id, className, ...rest },
  ref,
) {
  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        aria-label={rest["aria-label"]}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-ink data-placeholder:text-muted-foreground focus-visible:border-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="min-w-0 truncate" />
        <SelectPrimitive.Icon className="shrink-0">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-line bg-panel shadow-[0_18px_40px_-22px_rgba(26,25,22,0.5)]"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-ink outline-none data-highlighted:bg-muted data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check className="h-4 w-4 text-accent" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});
