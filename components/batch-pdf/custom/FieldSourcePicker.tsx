"use client";

import type { FieldSource } from "@/lib/batch-pdf/custom/types";

type FieldSourcePickerProps = {
  source: FieldSource;
  csvHeaders: string[];
  onChange: (source: FieldSource) => void;
};

export function FieldSourcePicker({
  source,
  csvHeaders,
  onChange,
}: FieldSourcePickerProps) {
  const firstHeader = csvHeaders[0] ?? "";

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Source
      </label>
      <select
        value={source.type}
        onChange={(event) => {
          if (event.target.value === "csvColumn") {
            onChange({ type: "csvColumn", column: firstHeader });
            return;
          }

          onChange({
            type: "staticText",
            value: source.type === "staticText" ? source.value : "Static text",
          });
        }}
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm"
      >
        <option value="csvColumn">CSV column</option>
        <option value="staticText">Static text</option>
      </select>

      {source.type === "csvColumn" ? (
        <select
          value={source.column}
          onChange={(event) =>
            onChange({ type: "csvColumn", column: event.target.value })
          }
          disabled={csvHeaders.length === 0}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
        >
          {csvHeaders.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      ) : null}

      {source.type === "staticText" ? (
        <input
          type="text"
          value={source.value}
          onChange={(event) =>
            onChange({ type: "staticText", value: event.target.value })
          }
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm"
        />
      ) : null}
    </div>
  );
}
