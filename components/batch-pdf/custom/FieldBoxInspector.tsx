"use client";

import { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { TextStyleControls } from "./TextStyleControls";
import { FontPicker } from "./fonts/FontPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { CUSTOM_DESIGN_LIMITS } from "@/lib/batch-pdf/limits";
import type { CustomFieldBox, FieldSource, TextBoxStyle } from "@/lib/batch-pdf/custom/types";

type FieldBoxInspectorProps = {
  box: CustomFieldBox | null;
  csvHeaders: string[];
  onUpdate: (boxId: string, patch: Partial<CustomFieldBox>) => void;
  onDelete: (boxId: string) => void;
};

const OVERFLOW_OPTIONS = [
  { value: "shrinkToFit", label: "Shrink to fit" },
  { value: "wrap", label: "Wrap to new lines" },
  { value: "truncate", label: "Truncate with …" },
  { value: "errorIfOverflow", label: "Block if it doesn't fit" },
];

const OVERFLOW_HINTS: Record<TextBoxStyle["overflowMode"], string> = {
  shrinkToFit: "Tries smaller text sizes down to the minimum font size.",
  wrap: "Moves text onto multiple lines within the box.",
  truncate: "Cuts text with an ellipsis when it does not fit.",
  errorIfOverflow: "Blocks export unless the full text fits at the configured size.",
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
}: FieldBoxInspectorProps) {
  const [showMore, setShowMore] = useState(false);

  if (!box) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-muted p-4 text-sm leading-6 text-muted-foreground">
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

  const sourceOptions = [
    ...csvHeaders.map((header) => ({ value: `csv:${header}`, label: header })),
    { value: "static", label: "Custom text" },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Selected field
        </p>
        <p className="mt-1 truncate text-base font-semibold text-ink">{friendlyFieldName(box)}</p>
      </div>

      <label className="block space-y-1 text-sm font-medium text-ink">
        <span>What text goes here?</span>
        <Select
          value={selectedSource}
          onValueChange={updateSource}
          options={sourceOptions}
          aria-label="What text goes here?"
        />
      </label>

      {box.source.type === "staticText" ? (
        <label className="block space-y-1 text-sm font-medium text-ink">
          <span>Custom text</span>
          <Input
            type="text"
            value={box.source.value}
            onChange={(event) =>
              onUpdate(box.id, {
                source: { type: "staticText", value: event.target.value },
              })
            }
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
          <Select
            value={box.style.fontWeight}
            onValueChange={(value) =>
              updateStyle({ fontWeight: value as TextBoxStyle["fontWeight"] })
            }
            options={[
              { value: "normal", label: "Normal" },
              { value: "bold", label: "Bold" },
            ]}
            aria-label="Font weight"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Text size
          </p>
          <div className="flex gap-1 rounded-lg border border-line bg-muted p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => updateFontSize(-2)}
              aria-label="Smaller text"
              title="Smaller"
              className="rounded-md text-ink hover:bg-panel"
            >
              <span aria-hidden>↓</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => updateFontSize(2)}
              aria-label="Bigger text"
              title="Bigger"
              className="rounded-md text-ink hover:bg-panel"
            >
              <span aria-hidden>↑</span>
            </Button>
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

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            If the text is too long
          </p>
          <Tooltip
            content={
              <div className="space-y-1.5">
                <p className="font-semibold text-panel">When text is wider than its box:</p>
                <p><span className="font-semibold">Shrink to fit</span> — lowers the font size (down to the minimum size) until it fits on one line.</p>
                <p><span className="font-semibold">Wrap to new lines</span> — keeps the size and flows text onto multiple lines; blocks export if the lines are taller than the box.</p>
                <p><span className="font-semibold">Truncate</span> — keeps the size and cuts extra text with an ellipsis (…).</p>
                <p><span className="font-semibold">Block if it doesn&apos;t fit</span> — keeps the size on one line and flags export until it fits.</p>
              </div>
            }
          >
            <button
              type="button"
              aria-label="How overflow handling works"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-accent"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
        <Select
          value={box.style.overflowMode}
          onValueChange={(value) =>
            updateStyle({ overflowMode: value as TextBoxStyle["overflowMode"] })
          }
          options={OVERFLOW_OPTIONS}
          aria-label="Text overflow handling"
        />
        <p className="text-xs leading-4 text-muted-foreground">
          {OVERFLOW_HINTS[box.style.overflowMode]}
        </p>
      </div>

      <div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onDelete(box.id)}
        >
          <Trash2 className="h-4 w-4" /> Delete field
        </Button>
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
