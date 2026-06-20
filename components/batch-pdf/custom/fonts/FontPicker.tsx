"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_LABELS,
  FONT_CATALOG,
  cssFontStack,
  getFontEntry,
  type FontCategory,
} from "@/lib/batch-pdf/custom/fonts/catalog";
import { useGoogleFonts } from "./useGoogleFonts";

type FontPickerProps = {
  value: string;
  onChange: (id: string) => void;
};

const CATEGORY_ORDER: FontCategory[] = [
  "sans",
  "serif",
  "display",
  "handwriting",
  "mono",
];

export function FontPicker({ value, onChange }: FontPickerProps) {
  useGoogleFonts();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLabel = getFontEntry(value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = FONT_CATALOG.filter((entry) =>
      needle ? entry.label.toLowerCase().includes(needle) : true,
    );
    return CATEGORY_ORDER.map((category) => ({
      category,
      entries: matches.filter((entry) => entry.category === category),
    })).filter((group) => group.entries.length > 0);
  }, [query]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-left text-sm font-medium normal-case tracking-normal text-ink"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate" style={{ fontFamily: cssFontStack(value) }}>
          {currentLabel}
        </span>
        <span className="text-muted-foreground" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-lg">
          <div className="border-b border-line p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fonts…"
              className="w-full rounded-md border border-line bg-muted px-3 py-2 text-sm normal-case tracking-normal text-ink"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1" role="listbox">
            {groups.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No fonts match “{query}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.category}>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {CATEGORY_LABELS[group.category]}
                  </p>
                  {group.entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      role="option"
                      aria-selected={entry.id === value}
                      onClick={() => select(entry.id)}
                      className={[
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm normal-case tracking-normal",
                        entry.id === value
                          ? "bg-accent/10 text-ink"
                          : "text-ink hover:bg-muted",
                      ].join(" ")}
                      style={{ fontFamily: cssFontStack(entry.id) }}
                    >
                      <span className="truncate">{entry.label}</span>
                      {entry.id === value ? (
                        <span className="text-accent" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
