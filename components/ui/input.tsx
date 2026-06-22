"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const fieldClasses =
  "w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted-foreground focus-visible:border-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldClasses, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn(fieldClasses, className)} {...props} />
  );
});

/** Shared field class for native controls that need to match the Input look. */
export const inputClassName = fieldClasses;
