"use client";

import { ControlGroup, NumberField, SegmentedControl, controlLabelClass } from "./exportControls";
import { Select } from "@/components/ui/select";
import { getCommonPageSizes } from "@/lib/batch-pdf/custom/export-options";
import type { ExportOptions, MeasurementUnit, PageSizeKey } from "@/lib/batch-pdf/custom/types";

const UNIT_OPTIONS = [
  { value: "in", label: "in" },
  { value: "mm", label: "mm" },
];

const PAGE_SIZE_OPTIONS: Array<{ key: PageSizeKey; label: string }> = [
  { key: "sameAsDesign", label: "Same as design" },
  ...getCommonPageSizes().map((size) => ({ key: size.key, label: size.label })),
];

export function PageSizeControls({
  options,
  onChange,
}: {
  options: ExportOptions;
  onChange: (patch: Partial<ExportOptions>) => void;
}) {
  const showCustom = options.pageSize === "custom";

  return (
    <div className="space-y-3">
      <ControlGroup label="Page size">
        <Select
          aria-label="Page size"
          value={options.pageSize}
          onValueChange={(value) => onChange({ pageSize: value as PageSizeKey })}
          options={PAGE_SIZE_OPTIONS.map((option) => ({ value: option.key, label: option.label }))}
        />
      </ControlGroup>

      <ControlGroup label="Orientation" hint="Auto picks the orientation that needs the fewest pages.">
        <SegmentedControl<ExportOptions["orientation"]>
          ariaLabel="Orientation"
          value={options.orientation}
          onChange={(orientation) => onChange({ orientation })}
          options={[
            { value: "auto", label: "Auto" },
            { value: "portrait", label: "Portrait" },
            { value: "landscape", label: "Landscape" },
          ]}
        />
      </ControlGroup>

      {showCustom ? (
        <div className="space-y-1.5">
          <p className={controlLabelClass}>Custom page size ({options.unit})</p>
          <div className="flex gap-2">
            <NumberField
              ariaLabel="Custom page width"
              value={options.customPageWidth}
              onChange={(customPageWidth) => onChange({ customPageWidth })}
              min={0.5}
              step={0.125}
              placeholder="Width"
            />
            <NumberField
              ariaLabel="Custom page height"
              value={options.customPageHeight}
              onChange={(customPageHeight) => onChange({ customPageHeight })}
              min={0.5}
              step={0.125}
              placeholder="Height"
            />
            <Select
              aria-label="Measurement unit"
              value={options.unit}
              onValueChange={(value) => onChange({ unit: value as MeasurementUnit })}
              options={UNIT_OPTIONS}
              className="w-20"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
