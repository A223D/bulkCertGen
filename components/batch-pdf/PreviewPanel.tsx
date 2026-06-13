import { getPreviewData } from "@/lib/batch-pdf/preview";
import type {
  BatchPdfError,
  BatchPdfTemplate,
  BatchPdfWarning,
  CsvRow,
  FieldMapping,
} from "@/lib/batch-pdf/types";
import { RowPreviewControls } from "./RowPreviewControls";
import { TemplatePreviewRenderer } from "./previews/TemplatePreviewRenderer";

type PreviewPanelProps = {
  template: BatchPdfTemplate | null;
  rows: CsvRow[];
  mapping: FieldMapping;
  previewRowIndex: number;
  mappingReady: boolean;
  errors?: BatchPdfError[];
  warnings?: BatchPdfWarning[];
  onPreviousRow: () => void;
  onNextRow: () => void;
  onBackToMapping: () => void;
};

export function PreviewPanel({
  template,
  rows,
  mapping,
  previewRowIndex,
  mappingReady,
  errors = [],
  warnings = [],
  onPreviousRow,
  onNextRow,
  onBackToMapping,
}: PreviewPanelProps) {
  const previewResult =
    template && mappingReady
      ? getPreviewData({
          rows,
          rowIndex: previewRowIndex,
          mapping,
          template,
        })
      : null;

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preview
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {template?.name ?? "Template preview"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBackToMapping}
            disabled={!template}
            className={[
              "rounded-lg border px-3 py-2 text-sm font-medium",
              template
                ? "border-line bg-panel hover:border-accent hover:text-accent"
                : "cursor-not-allowed border-line bg-disabled text-disabled-foreground",
            ].join(" ")}
          >
            Back to mapping
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-disabled px-3 py-2 text-sm font-medium text-disabled-foreground"
          >
            Continue to export
          </button>
        </div>
      </div>

      {errors.length > 0 || warnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          {errors.map((error) => (
            <p
              key={`${error.code}-${error.fieldKey ?? "general"}`}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error.message}
            </p>
          ))}
          {warnings.map((warning) => (
            <p
              key={`${warning.code}-${warning.fieldKey ?? "general"}`}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              {warning.message}
            </p>
          ))}
        </div>
      ) : null}

      {!template || !mappingReady ? (
        <div className="mt-5 flex min-h-72 items-center justify-center rounded-lg border border-dashed border-line bg-muted p-6">
          <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 text-center">
            <p className="text-sm font-semibold text-ink">
              {template ? template.name : "No template selected"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Map required fields before preview is available.
            </p>
          </div>
        </div>
      ) : null}

      {previewResult && !previewResult.ok ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {previewResult.errors[0]?.message ?? "Preview is unavailable."}
        </div>
      ) : null}

      {template && previewResult?.ok ? (
        <div className="mt-5 space-y-4">
          <RowPreviewControls
            rowIndex={previewResult.value.rowIndex}
            rowCount={previewResult.value.rowCount}
            onPrevious={onPreviousRow}
            onNext={onNextRow}
          />
          <div className="rounded-lg border border-dashed border-line bg-muted p-4">
            <TemplatePreviewRenderer
              template={template}
              data={previewResult.value.data}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
