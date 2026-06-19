"use client";

import { useMemo, useState } from "react";
import { CustomDesignStage } from "./CustomDesignStage";
import { FieldBoxInspector } from "./FieldBoxInspector";
import {
  addFieldBox,
  createDefaultCsvFieldBox,
  createDefaultStaticTextBox,
  duplicateFieldBox,
  getFieldBoxById,
  isCustomFieldPlacementReady,
  removeFieldBox,
  updateFieldBox,
} from "@/lib/batch-pdf/custom/field-box-state";
import { validateCustomFieldBoxes } from "@/lib/batch-pdf/custom/field-boxes";
import type { BatchPdfError } from "@/lib/batch-pdf/types";
import type {
  CustomFieldBox,
  DesignAsset,
  NormalizedRect,
} from "@/lib/batch-pdf/custom/types";

type CustomFieldPlacementEditorProps = {
  file: File | null;
  asset: DesignAsset | null;
  previewUrl: string | null;
  csvHeaders: string[];
  boxes: CustomFieldBox[];
  selectedBoxId: string | null;
  onBoxesChange: (boxes: CustomFieldBox[]) => void;
  onSelectedBoxChange: (boxId: string | null) => void;
};

export function CustomFieldPlacementEditor({
  file,
  asset,
  previewUrl,
  csvHeaders,
  boxes,
  selectedBoxId,
  onBoxesChange,
  onSelectedBoxChange,
}: CustomFieldPlacementEditorProps) {
  const [selectedColumn, setSelectedColumn] = useState(csvHeaders[0] ?? "");
  const [actionErrors, setActionErrors] = useState<BatchPdfError[]>([]);
  const selectedBox = getFieldBoxById(boxes, selectedBoxId);
  const validation = useMemo(
    () => validateCustomFieldBoxes(boxes, csvHeaders),
    [boxes, csvHeaders],
  );
  const placementReady = isCustomFieldPlacementReady({ boxes, csvHeaders });
  const validationErrors = validation.ok ? [] : validation.errors;
  const hasCsvHeaders = csvHeaders.length > 0;
  const safeSelectedColumn = csvHeaders.includes(selectedColumn)
    ? selectedColumn
    : csvHeaders[0] ?? "";
  const summaryErrors = [
    ...(!hasCsvHeaders
      ? [
          {
            code: "custom_editor_no_csv_headers",
            message: "Upload a CSV with headers before adding custom fields.",
          },
        ]
      : []),
    ...(!asset
      ? [
          {
            code: "custom_editor_no_design_asset",
            message: "Upload a design before placing fields.",
          },
        ]
      : []),
    ...validationErrors,
    ...actionErrors,
  ];

  function applyBoxesResult(
    result: ReturnType<typeof addFieldBox>,
    selectedId?: string,
  ) {
    if (!result.ok) {
      setActionErrors(result.errors);
      return;
    }

    setActionErrors([]);
    onBoxesChange(result.value);

    if (selectedId) {
      onSelectedBoxChange(selectedId);
    }
  }

  function handleAddCsvField() {
    if (!safeSelectedColumn) {
      setActionErrors([
        {
          code: "custom_editor_no_csv_column",
          message: "Choose a CSV column before adding a field.",
        },
      ]);
      return;
    }

    const box = createDefaultCsvFieldBox({
      column: safeSelectedColumn,
      existingBoxes: boxes,
    });

    applyBoxesResult(
      addFieldBox({ boxes, box, csvHeaders }),
      box.id,
    );
  }

  function handleAddStaticText() {
    const box = createDefaultStaticTextBox({ existingBoxes: boxes });

    applyBoxesResult(
      addFieldBox({ boxes, box, csvHeaders }),
      box.id,
    );
  }

  function handleUpdateBox(boxId: string, patch: Partial<CustomFieldBox>) {
    const result = updateFieldBox({ boxes, boxId, patch, csvHeaders });

    if (!result.ok) {
      setActionErrors(result.errors);
      return;
    }

    setActionErrors([]);
    onBoxesChange(result.value);
  }

  function handleUpdateBoxRect(boxId: string, rect: NormalizedRect) {
    handleUpdateBox(boxId, { rect });
  }

  function handleDeleteBox(boxId: string) {
    const nextBoxes = removeFieldBox({ boxes, boxId });

    setActionErrors([]);
    onBoxesChange(nextBoxes);
    onSelectedBoxChange(nextBoxes[0]?.id ?? null);
  }

  function handleDuplicateBox(boxId: string) {
    const result = duplicateFieldBox({ boxes, boxId, csvHeaders });

    if (!result.ok) {
      setActionErrors(result.errors);
      return;
    }

    setActionErrors([]);
    onBoxesChange(result.value);
    onSelectedBoxChange(result.value[result.value.length - 1]?.id ?? null);
  }

  return (
    <section
      className="min-w-0"
      aria-labelledby="custom-field-placement-heading"
    >
      <h2 id="custom-field-placement-heading" className="sr-only">
        Put text where it belongs
      </h2>

      {asset ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <CustomDesignStage
              file={file}
              asset={asset}
              previewUrl={previewUrl}
              boxes={boxes}
              selectedBoxId={selectedBoxId}
              onSelectBox={onSelectedBoxChange}
              onUpdateBoxRect={handleUpdateBoxRect}
            />
          </div>

          <aside className="min-h-0 space-y-3 xl:sticky xl:top-28 xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto xl:pr-1">
            <div className="rounded-lg border border-line bg-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Add a field
              </p>
              <label className="mt-3 block space-y-1 text-sm font-medium text-ink">
                <span>Spreadsheet column</span>
                <select
                  value={safeSelectedColumn}
                  onChange={(event) => setSelectedColumn(event.target.value)}
                  disabled={!hasCsvHeaders}
                  className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
                >
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleAddCsvField}
                disabled={!hasCsvHeaders}
                className="mt-3 w-full rounded-lg bg-ink px-3 py-2 text-sm font-medium text-panel hover:bg-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
              >
                Add this field
              </button>
              <button
                type="button"
                onClick={handleAddStaticText}
                className="mt-2 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent"
              >
                Add custom text
              </button>
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                Tip: add one field, place it, then adjust the style before adding the next one.
              </p>
            </div>

            {boxes.length > 0 ? (
              <div className="rounded-lg border border-line bg-panel p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Fields on design
                </p>
                <div className="flex flex-wrap gap-2">
                  {boxes.map((box) => {
                    const selected = box.id === selectedBoxId;
                    return (
                      <button
                        key={box.id}
                        type="button"
                        onClick={() => onSelectedBoxChange(box.id)}
                        className={[
                          "max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-semibold",
                          selected
                            ? "border-accent bg-accent-soft text-ink"
                            : "border-line bg-muted text-muted-foreground hover:border-accent hover:text-ink",
                        ].join(" ")}
                      >
                        {box.label || (box.source.type === "csvColumn" ? box.source.column : "Custom text")}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <FieldBoxInspector
              box={selectedBox}
              csvHeaders={csvHeaders}
              onUpdate={handleUpdateBox}
              onDelete={handleDeleteBox}
              onDuplicate={handleDuplicateBox}
            />

            {summaryErrors.length > 0 ? (
              <div className="space-y-2">
                {summaryErrors.map((error) => (
                  <p
                    key={`${error.code}-${error.fieldKey ?? "general"}`}
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {error.message}
                  </p>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                {placementReady ? "Ready to check." : "Add at least one field to continue."}
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-line bg-muted p-6 text-center text-sm text-muted-foreground">
          Upload and preview a supported design before placing fields.
        </div>
      )}
    </section>
  );
}
