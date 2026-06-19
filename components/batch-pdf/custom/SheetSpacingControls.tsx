"use client";

import { NumberField, controlLabelClass } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

export function SheetSpacingControls({
  options,
  onChange,
}: {
  options: ExportOptions;
  onChange: (patch: Partial<ExportOptions>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className={controlLabelClass}>Margins ({options.unit})</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            ariaLabel="Top margin"
            value={options.marginTop}
            onChange={(marginTop) => onChange({ marginTop: marginTop ?? 0 })}
            min={0}
            step={0.0625}
            placeholder="Top"
          />
          <NumberField
            ariaLabel="Right margin"
            value={options.marginRight}
            onChange={(marginRight) => onChange({ marginRight: marginRight ?? 0 })}
            min={0}
            step={0.0625}
            placeholder="Right"
          />
          <NumberField
            ariaLabel="Bottom margin"
            value={options.marginBottom}
            onChange={(marginBottom) => onChange({ marginBottom: marginBottom ?? 0 })}
            min={0}
            step={0.0625}
            placeholder="Bottom"
          />
          <NumberField
            ariaLabel="Left margin"
            value={options.marginLeft}
            onChange={(marginLeft) => onChange({ marginLeft: marginLeft ?? 0 })}
            min={0}
            step={0.0625}
            placeholder="Left"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={controlLabelClass}>Gaps ({options.unit})</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            ariaLabel="Horizontal gap"
            value={options.gapX}
            onChange={(gapX) => onChange({ gapX: gapX ?? 0 })}
            min={0}
            step={0.0625}
            placeholder="Horizontal"
          />
          <NumberField
            ariaLabel="Vertical gap"
            value={options.gapY}
            onChange={(gapY) => onChange({ gapY: gapY ?? 0 })}
            min={0}
            step={0.0625}
            placeholder="Vertical"
          />
        </div>
      </div>
    </div>
  );
}
