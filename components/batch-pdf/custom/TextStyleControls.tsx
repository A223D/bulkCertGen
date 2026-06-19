"use client";

import { CUSTOM_DESIGN_LIMITS } from "@/lib/batch-pdf/limits";
import type { TextBoxStyle } from "@/lib/batch-pdf/custom/types";

type TextStyleControlsProps = {
  style: TextBoxStyle;
  onChange: (style: TextBoxStyle) => void;
};

function numberValue(value: string): number {
  return Number.parseFloat(value);
}

export function TextStyleControls({ style, onChange }: TextStyleControlsProps) {
  function patch(patch: Partial<TextBoxStyle>) {
    onChange({ ...style, ...patch });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Text style
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Size</span>
          <input
            type="number"
            min={CUSTOM_DESIGN_LIMITS.minFontSize}
            max={CUSTOM_DESIGN_LIMITS.maxFontSize}
            value={style.fontSize}
            onChange={(event) => patch({ fontSize: numberValue(event.target.value) })}
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Min size</span>
          <input
            type="number"
            min={CUSTOM_DESIGN_LIMITS.minFontSize}
            max={CUSTOM_DESIGN_LIMITS.maxFontSize}
            value={style.minFontSize}
            onChange={(event) =>
              patch({ minFontSize: numberValue(event.target.value) })
            }
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Color</span>
          <input
            type="color"
            value={style.color}
            onChange={(event) => patch({ color: event.target.value })}
            className="h-10 w-full rounded-lg border border-line bg-panel px-2 py-1"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Line height</span>
          <input
            type="number"
            min="0.8"
            max="2"
            step="0.05"
            value={style.lineHeight}
            onChange={(event) =>
              patch({ lineHeight: numberValue(event.target.value) })
            }
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Horizontal</span>
          <select
            value={style.align}
            onChange={(event) =>
              patch({ align: event.target.value as TextBoxStyle["align"] })
            }
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Vertical</span>
          <select
            value={style.verticalAlign}
            onChange={(event) =>
              patch({
                verticalAlign: event.target.value as TextBoxStyle["verticalAlign"],
              })
            }
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={style.uppercase}
          onChange={(event) => patch({ uppercase: event.target.checked })}
          className="h-4 w-4 accent-accent"
        />
        Uppercase
      </label>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          <span>Overflow mode</span>
          <select
            value={style.overflowMode}
            onChange={(event) =>
              patch({
                overflowMode: event.target.value as TextBoxStyle["overflowMode"],
              })
            }
            className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
          >
            <option value="shrinkToFit">Shrink to fit</option>
            <option value="wrap">Wrap</option>
            <option value="truncate">Truncate</option>
            <option value="errorIfOverflow">Error if overflow</option>
          </select>
        </label>
        <p className="text-xs leading-4 text-muted-foreground">
          {style.overflowMode === "shrinkToFit" &&
            "Tries smaller text sizes down to the minimum font size."}
          {style.overflowMode === "wrap" &&
            "Moves text onto multiple lines within the box."}
          {style.overflowMode === "truncate" &&
            "Cuts text with an ellipsis when it does not fit."}
          {style.overflowMode === "errorIfOverflow" &&
            "Blocks export unless the full text fits at the configured size."}
        </p>
      </div>
    </div>
  );
}
