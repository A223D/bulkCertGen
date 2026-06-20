"use client";

import { useState } from "react";
import { TextStyleControls } from "./TextStyleControls";
import { FontPicker } from "./fonts/FontPicker";
import { CUSTOM_DESIGN_LIMITS } from "@/lib/batch-pdf/limits";
import type { CustomFieldBox, FieldSource, TextBoxStyle } from "@/lib/batch-pdf/custom/types";

type FieldBoxInspectorProps = {
  box: CustomFieldBox | null;
  csvHeaders: string[];
  onUpdate: (boxId: string, patch: Partial<CustomFieldBox>) => void;
  onDelete: (boxId: string) => void;
  onDuplicate: (boxId: string) => void;
};

function sourceValue(source: FieldSource): string {
  return source.type === "csvColumn" ? `csv:${source.column}` : "static";
}

function clampFontSize(size: number): number {
  return Math.max(
    CUSTOM_DESIGN_LIMITS.minFontSize,
    Math.min(CUSTOM_DESIGN_LIMITS.maxFontSize, size),
  );
}

function patchStyle(style: TextBoxStyle, patch: Partial<TextBoxStyle>): TextBoxStyle {
  return { ...style, ...patch };
}

function friendlyFieldName(box: CustomFieldBox): string {
  if (box.source.type === "csvColumn") {
    return box.source.column;
  }

  return box.source.value || "Custom text";
}

export function FieldBoxInspector({
  box,
  csvHeaders,
  onUpdate,
  onDelete,
  onDuplicate,
}: FieldBoxInspectorProps) {
  const [showMore, setShowMore] = useState(false);

  if (!box) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-muted p-4 text-sm leading-6 text-muted-foreground">
        Add a field or click a box on the design to edit it.
      </div>
    );
  }

  const selectedSource = sourceValue(box.source);

  function updateSource(value: string) {
    if (!box) return;

    if (value === "static") {
      onUpdate(box.id, {
        source: {
          type: "staticText",
          value: box.source.type === "staticText" ? box.source.value : "Custom text",
        },
        label: box.label || "Custom text",
      });
      return;
    }

    const column = value.replace(/^csv:/, "");
    onUpdate(box.id, {
      source: { type: "csvColumn", column },
      label: box.label || column,
    });
  }

  function updateFontSize(delta: number) {
    if (!box) return;
    onUpdate(box.id, {
      style: patchStyle(box.style, {
        fontSize: clampFontSize(box.style.fontSize + delta),
      }),
    });
  }

  function updateAlign(align: TextBoxStyle["align"]) {
    if (!box) return;
    onUpdate(box.id, { style: patchStyle(box.style, { align }) });
  }

  function updateStyle(patch: Partial<TextBoxStyle>) {
    if (!box) return;
    onUpdate(box.id, { style: patchStyle(box.style, patch) });
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-panel p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Selected field
        </p>
        <p className="mt-1 truncate text-base font-semibold text-ink">{friendlyFieldName(box)}</p>
      </div>

      <label className="space-y-1 text-sm font-medium text-ink">
        <span>What text goes here?</span>
        <select
          value={selectedSource}
          onChange={(event) => updateSource(event.target.value)}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm"
        >
          {csvHeaders.map((header) => (
            <option key={header} value={`csv:${header}`}>
              {header}
            </option>
          ))}
          <option value="static">Custom text</option>
        </select>
      </label>

      {box.source.type === "staticText" ? (
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>Custom text</span>
          <input
            type="text"
            value={box.source.value}
            onChange={(event) =>
              onUpdate(box.id, {
                source: { type: "staticText", value: event.target.value },
              })
            }
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm"
          />
        </label>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Font</span>
          <FontPicker
            value={box.style.fontFamily}
            onChange={(fontFamily) => updateStyle({ fontFamily })}
          />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Weight</span>
          <select
            value={box.style.fontWeight}
            onChange={(event) =>
              updateStyle({ fontWeight: event.target.value as TextBoxStyle["fontWeight"] })
            }
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Text size
          </p>
          <div className="flex rounded-lg border border-line bg-muted p-1">
            <button
              type="button"
              onClick={() => updateFontSize(-2)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-panel"
            >
              <span aria-hidden>↓</span> Smaller
            </button>
            <button
              type="button"
              onClick={() => updateFontSize(2)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-panel"
            >
              <span aria-hidden>↑</span> Bigger
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Align
          </p>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-muted p-1">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                type="button"
                aria-label={`Align ${align}`}
                title={`Align ${align}`}
                onClick={() => updateAlign(align)}
                className={[
                  "min-w-0 rounded-md px-1 py-1.5 text-xs font-semibold uppercase",
                  box.style.align === align
                    ? "bg-ink text-panel"
                    : "hover:bg-panel",
                ].join(" ")}
              >
                {align[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDuplicate(box.id)}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(box.id)}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <div className="border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="flex w-full items-center justify-between text-sm font-semibold text-ink"
        >
          <span>More text settings</span>
          <span className="text-muted-foreground">{showMore ? "-" : "+"}</span>
        </button>

        {showMore ? (
          <div className="mt-4 space-y-4">
            <TextStyleControls
              style={box.style}
              onChange={(style) => onUpdate(box.id, { style })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
