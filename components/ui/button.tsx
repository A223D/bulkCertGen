"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "brand"
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-bold transition-[color,background-color,border-color,box-shadow,transform] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none";

const variants: Record<ButtonVariant, string> = {
  // Gold call-to-action — primary action on a step.
  brand:
    "bg-[var(--color-brand,#f2b01e)] text-[var(--color-brand-contrast,#1a1916)] shadow-[0_2px_0_var(--color-brand-strong,#c98f11)] hover:bg-[#ffbe3a]",
  // Ink — confirm / continue actions.
  primary: "bg-ink text-panel hover:bg-ink-soft",
  // Outline on panel.
  secondary:
    "border border-line bg-panel text-ink hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-muted-foreground hover:text-ink",
  danger:
    "border border-danger-line bg-danger-soft text-danger hover:bg-[#f7e2db]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-[15px]",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", fullWidth, asChild, className, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
