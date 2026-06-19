"use client";

import { ControlGroup, NumberField, SegmentedControl, controlLabelClass, inputClass } from "./exportControls";
import { getCommonPageSizes } from "@/lib/batch-pdf/custom/export-options";
import type { ExportOptions, MeasurementUnit, PageSizeKey } from "@/lib/batch-pdf/custom/types";

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
        <select
          aria-label="Page size"
          value={options.pageSize}
          onChange={(event) => onChange({ pageSize: event.target.value as PageSizeKey })}
          className={inputClass}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </ControlGroup>

      <ControlGroup label="Orientation">
        <SegmentedControl<ExportOptions["orientation"]>
          ariaLabel="Orientation"
          value={options.orientation}
          onChange={(orientation) => onChange({ orientation })}
          options={[
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
