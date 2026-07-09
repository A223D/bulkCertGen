"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [colorDraft, setColorDraft] = useState(style.color);

  useEffect(() => {
    setColorDraft(style.color);
  }, [style.color]);

  function patch(patch: Partial<TextBoxStyle>) {
    onChange({ ...style, ...patch });
  }

  function handleColorChange(value: string) {
    setColorDraft(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      patch({ color: value });
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Text style
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Size</span>
          <Input
            type="number"
            min={CUSTOM_DESIGN_LIMITS.minFontSize}
            max={CUSTOM_DESIGN_LIMITS.maxFontSize}
            value={style.fontSize}
            onChange={(event) => patch({ fontSize: numberValue(event.target.value) })}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Min size</span>
          <Input
            type="number"
            min={CUSTOM_DESIGN_LIMITS.minFontSize}
            max={CUSTOM_DESIGN_LIMITS.maxFontSize}
            value={style.minFontSize}
            onChange={(event) =>
              patch({ minFontSize: numberValue(event.target.value) })
            }
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Color</span>
          <div className="grid grid-cols-[44px_1fr] gap-2">
            <input
              type="color"
              value={style.color}
              onChange={(event) => handleColorChange(event.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-panel px-1 py-1"
              aria-label="Text color picker"
            />
            <Input
              type="text"
              value={colorDraft}
              onChange={(event) => handleColorChange(event.target.value)}
              onBlur={() => {
                if (!/^#[0-9a-fA-F]{6}$/.test(colorDraft)) setColorDraft(style.color);
              }}
              aria-label="Text color hex value"
              spellCheck={false}
            />
          </div>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Line height</span>
          <Input
            type="number"
            min="0.8"
            max="2"
            step="0.05"
            value={style.lineHeight}
            onChange={(event) =>
              patch({ lineHeight: numberValue(event.target.value) })
            }
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Horizontal</span>
          <Select
            value={style.align}
            onValueChange={(value) => patch({ align: value as TextBoxStyle["align"] })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            aria-label="Horizontal alignment"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          <span>Vertical</span>
          <Select
            value={style.verticalAlign}
            onValueChange={(value) =>
              patch({ verticalAlign: value as TextBoxStyle["verticalAlign"] })
            }
            options={[
              { value: "top", label: "Top" },
              { value: "middle", label: "Middle" },
              { value: "bottom", label: "Bottom" },
            ]}
            aria-label="Vertical alignment"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <Checkbox
          checked={style.uppercase}
          onCheckedChange={(checked) => patch({ uppercase: checked })}
          aria-label="Uppercase"
        />
        Uppercase
      </label>
    </div>
  );
}
