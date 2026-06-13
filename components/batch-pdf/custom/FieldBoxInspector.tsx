"use client";

import { FieldSourcePicker } from "./FieldSourcePicker";
import { TextStyleControls } from "./TextStyleControls";
import type { CustomFieldBox } from "@/lib/batch-pdf/custom/types";

type FieldBoxInspectorProps = {
  box: CustomFieldBox | null;
  csvHeaders: string[];
  onUpdate: (boxId: string, patch: Partial<CustomFieldBox>) => void;
  onDelete: (boxId: string) => void;
  onDuplicate: (boxId: string) => void;
};

export function FieldBoxInspector({
  box,
  csvHeaders,
  onUpdate,
  onDelete,
  onDuplicate,
}: FieldBoxInspectorProps) {
  if (!box) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-muted p-3 text-sm leading-6 text-muted-foreground">
        Select a field box to edit its source, label, and text style.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="space-y-1 text-xs font-medium text-muted-foreground">
        <span>Label</span>
        <input
          type="text"
          value={box.label}
          onChange={(event) => onUpdate(box.id, { label: event.target.value })}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink"
        />
      </label>

      <FieldSourcePicker
        source={box.source}
        csvHeaders={csvHeaders}
        onChange={(source) => onUpdate(box.id, { source })}
      />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={box.required}
          onChange={(event) => onUpdate(box.id, { required: event.target.checked })}
          className="h-4 w-4 accent-accent"
        />
        Required
      </label>

      <TextStyleControls
        style={box.style}
        onChange={(style) => onUpdate(box.id, { style })}
      />

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
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
    </div>
  );
}
