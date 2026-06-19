"use client";

import { ControlGroup, NumberField, SegmentedControl, controlLabelClass } from "./exportControls";
import type { ExportOptions, MeasurementUnit } from "@/lib/batch-pdf/custom/types";

export function ItemSizeControls({
  options,
  isImageDesign,
  onChange,
}: {
  options: ExportOptions;
  isImageDesign: boolean;
  onChange: (patch: Partial<ExportOptions>) => void;
}) {
  const showCustom = options.itemSizeMode === "custom" || isImageDesign;

  return (
    <div className="space-y-3">
      <ControlGroup
        label="Item size"
        hint={
          isImageDesign
            ? "Image files use pixels. Enter the intended print size so text fit and export dimensions match."
            : undefined
        }
      >
        <SegmentedControl<ExportOptions["itemSizeMode"]>
          ariaLabel="Item size mode"
          value={options.itemSizeMode}
          onChange={(itemSizeMode) => onChange({ itemSizeMode })}
          options={[
            { value: "fromDesign", label: "Same as design" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </ControlGroup>

      {showCustom ? (
        <div className="space-y-1.5">
          <p className={controlLabelClass}>Item dimensions ({options.unit})</p>
          <div className="flex gap-2">
            <NumberField
              ariaLabel="Custom item width"
              value={options.customItemWidth}
              onChange={(customItemWidth) => onChange({ customItemWidth })}
              min={0.5}
              step={0.125}
              placeholder="Width"
            />
            <NumberField
              ariaLabel="Custom item height"
              value={options.customItemHeight}
              onChange={(customItemHeight) => onChange({ customItemHeight })}
              min={0.5}
              step={0.125}
              placeholder="Height"
            />
            <select
              aria-label="Measurement unit"
              value={options.unit}
              onChange={(event) => onChange({ unit: event.target.value as MeasurementUnit })}
              className="rounded border border-line bg-background px-2 py-1 text-sm"
            >
              <option value="in">in</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
