"use client";

import type { CustomFieldBox } from "@/lib/batch-pdf/custom/types";

type FieldBoxListProps = {
  boxes: CustomFieldBox[];
  selectedBoxId: string | null;
  onSelect: (boxId: string) => void;
};

function sourceLabel(box: CustomFieldBox): string {
  if (box.source.type === "csvColumn") {
    return box.source.column;
  }

  return box.source.value;
}

export function FieldBoxList({
  boxes,
  selectedBoxId,
  onSelect,
}: FieldBoxListProps) {
  if (boxes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-muted p-3 text-sm leading-6 text-muted-foreground">
        No fields yet. Add a CSV field or static text box to begin placement.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {boxes.map((box) => {
        const isSelected = box.id === selectedBoxId;

        return (
          <button
            key={box.id}
            type="button"
            onClick={() => onSelect(box.id)}
            className={[
              "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              isSelected
                ? "border-accent bg-accent-soft text-ink"
                : "border-line bg-panel hover:border-accent",
            ].join(" ")}
          >
            <span className="block truncate font-medium">{box.label}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {box.source.type === "csvColumn" ? "CSV" : "Static"}: {sourceLabel(box)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
