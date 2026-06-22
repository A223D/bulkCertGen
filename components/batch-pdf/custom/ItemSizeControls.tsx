"use client";

import { ControlGroup, NumberField, SegmentedControl, controlLabelClass } from "./exportControls";
import { Select } from "@/components/ui/select";
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
            <Select
              aria-label="Measurement unit"
              value={options.unit}
              onValueChange={(value) => onChange({ unit: value as MeasurementUnit })}
              options={[
                { value: "in", label: "in" },
                { value: "mm", label: "mm" },
              ]}
              className="w-20"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
