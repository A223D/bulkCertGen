"use client";

import { useMemo, useState } from "react";
import { CustomDesignStage } from "./CustomDesignStage";
import { FieldBoxInspector } from "./FieldBoxInspector";
import { FieldBoxList } from "./FieldBoxList";
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
      className="rounded-lg border border-line bg-panel p-4"
      aria-labelledby="custom-field-placement-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Add fields
          </p>
          <h2 id="custom-field-placement-heading" className="mt-2 text-xl font-semibold">
            Place fields on the design
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add CSV columns or static text, then drag and resize the boxes. Text fit checking and custom export come next.
          </p>
        </div>
        <span className="w-fit rounded-full border border-line bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Client state only
        </span>
      </div>

      {asset ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <CustomDesignStage
            file={file}
            asset={asset}
            previewUrl={previewUrl}
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            onSelectBox={onSelectedBoxChange}
            onUpdateBoxRect={handleUpdateBoxRect}
          />

          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Add field
              </p>
              <div className="mt-3 space-y-3">
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAddCsvField}
                    disabled={!hasCsvHeaders}
                    className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-panel hover:bg-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
                  >
                    Add CSV field
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStaticText}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent"
                  >
                    Add static text
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Fields
              </p>
              <FieldBoxList
                boxes={boxes}
                selectedBoxId={selectedBoxId}
                onSelect={onSelectedBoxChange}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Inspector
              </p>
              <FieldBoxInspector
                box={selectedBox}
                csvHeaders={csvHeaders}
                onUpdate={handleUpdateBox}
                onDelete={handleDeleteBox}
                onDuplicate={handleDuplicateBox}
              />
            </div>

            <div className="rounded-lg border border-line bg-panel p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Validation
              </p>
              {summaryErrors.length > 0 ? (
                <div className="mt-3 space-y-2">
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
                <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  Field boxes are valid.
                </p>
              )}
              {!placementReady ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Add at least one valid field box before preflight.
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-line bg-muted p-3">
              <p className="text-sm font-semibold text-ink">Text fit check comes next.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Custom export remains disabled until preflight and rendering are implemented.
              </p>
              <button
                type="button"
                disabled
                className="mt-3 cursor-not-allowed rounded-lg bg-disabled px-3 py-2 text-sm font-medium text-disabled-foreground"
              >
                Continue to preflight
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-line bg-muted p-6 text-center text-sm text-muted-foreground">
          Upload and preview a supported design before placing fields.
        </div>
      )}
    </section>
  );
}
