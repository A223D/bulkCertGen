"use client";

import type { ResizeHandle } from "@/lib/batch-pdf/custom/editor-geometry";
import type { CustomFieldBox } from "@/lib/batch-pdf/custom/types";

type FieldBoxOverlayProps = {
  box: CustomFieldBox;
  selected: boolean;
  onSelect: (boxId: string) => void;
  onMoveStart: (boxId: string, event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeStart: (
    boxId: string,
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLDivElement>,
  ) => void;
  onKeyDown: (boxId: string, event: React.KeyboardEvent<HTMLDivElement>) => void;
};

function boxLabel(box: CustomFieldBox): string {
  if (box.label.trim()) {
    return box.label;
  }

  return box.source.type === "csvColumn" ? box.source.column : "Static text";
}

export function FieldBoxOverlay({
  box,
  selected,
  onSelect,
  onMoveStart,
  onResizeStart,
  onKeyDown,
}: FieldBoxOverlayProps) {
  const label = boxLabel(box);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Field box: ${label}`}
      onPointerDown={(event) => onMoveStart(box.id, event)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(box.id);
      }}
      onKeyDown={(event) => onKeyDown(box.id, event)}
      className={[
        "absolute touch-none select-none overflow-hidden rounded border bg-panel/75 text-[11px] font-semibold shadow-sm backdrop-blur-[1px]",
        selected
          ? "border-accent ring-2 ring-accent"
          : "border-ink/40 hover:border-accent",
      ].join(" ")}
      style={{
        left: `${box.rect.x * 100}%`,
        top: `${box.rect.y * 100}%`,
        width: `${box.rect.width * 100}%`,
        height: `${box.rect.height * 100}%`,
        color: box.style.color,
      }}
    >
      <span className="block truncate px-2 py-1">{label}</span>
      {(["nw", "ne", "sw", "se"] as const).map((handle) => (
        <div
          key={handle}
          aria-hidden="true"
          onPointerDown={(event) => onResizeStart(box.id, handle, event)}
          className={[
            "absolute h-3 w-3 rounded-sm border border-accent bg-panel",
            handle.includes("n") ? "-top-1.5" : "-bottom-1.5",
            handle.includes("w") ? "-left-1.5" : "-right-1.5",
            handle === "nw" || handle === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
