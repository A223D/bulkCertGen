"use client";

type RowPreviewControlsProps = {
  rowIndex: number;
  rowCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function RowPreviewControls({
  rowIndex,
  rowCount,
  onPrevious,
  onNext,
}: RowPreviewControlsProps) {
  const isFirstRow = rowIndex <= 0;
  const isLastRow = rowIndex >= rowCount - 1;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-ink">
        Previewing row {rowIndex + 1} of {rowCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstRow}
          className={[
            "rounded-lg border px-3 py-2 text-sm font-medium",
            isFirstRow
              ? "cursor-not-allowed border-line bg-disabled text-disabled-foreground"
              : "border-line bg-panel hover:border-accent hover:text-accent",
          ].join(" ")}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLastRow}
          className={[
            "rounded-lg border px-3 py-2 text-sm font-medium",
            isLastRow
              ? "cursor-not-allowed border-line bg-disabled text-disabled-foreground"
              : "border-line bg-panel hover:border-accent hover:text-accent",
          ].join(" ")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
