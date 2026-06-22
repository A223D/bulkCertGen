"use client";

import { useEffect, useState } from "react";
import { Checkbox as UiCheckbox } from "@/components/ui/checkbox";

// Shared presentational primitives for the custom export options controls.
// State is owned by the parent; these components only render and emit changes.

export const controlLabelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export const inputClass =
  "w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-ink";

export function ControlGroup({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className={controlLabelClass}>{label}</p>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1.5 rounded-md border border-line bg-muted p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex-1 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-semibold transition ${
              selected
                ? "bg-ink text-panel shadow-sm"
                : "text-muted-foreground hover:bg-panel hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Controlled numeric field with an internal text buffer so partial entries
 * (e.g. "8." while typing) don't fight the user. The parent always receives a
 * resolved number (or undefined when empty) and remains the source of truth.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  ariaLabel,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(value === undefined ? "" : String(value));

  useEffect(() => {
    const parsed = text.trim() === "" ? undefined : Number.parseFloat(text);
    const normalizedParsed =
      parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
    if (normalizedParsed !== value) {
      setText(value === undefined ? "" : String(value));
    }
    // Only re-sync when the external value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={text}
      placeholder={placeholder}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (next.trim() === "") {
          onChange(undefined);
          return;
        }
        const parsed = Number.parseFloat(next);
        onChange(Number.isFinite(parsed) ? parsed : undefined);
      }}
      className={inputClass}
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <UiCheckbox
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
        className="mt-0.5"
      />
      <span>
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint ? (
          <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}
