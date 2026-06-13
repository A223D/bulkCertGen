import type {
  BatchPdfError,
  BatchPdfWarning,
  CsvParseResult,
} from "@/lib/batch-pdf/types";

type ValidationSummaryProps = {
  csv: CsvParseResult | null;
  templateName?: string | null;
  errors?: BatchPdfError[];
  warnings?: BatchPdfWarning[];
  isMappingValid?: boolean;
};

export function ValidationSummary({
  csv,
  templateName = null,
  errors = [],
  warnings = [],
  isMappingValid = false,
}: ValidationSummaryProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Validation
      </p>
      {csv ? (
        <>
          <h2 className="mt-2 text-lg font-semibold">CSV ready</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Parsed {csv.rowCount} rows across {csv.headers.length} columns.
          </p>
          {templateName ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Template: {templateName}.{" "}
              {isMappingValid
                ? "Required fields are mapped."
                : "Required fields still need attention."}
            </p>
          ) : null}
          {errors.length > 0 ? (
            <div className="mt-4 space-y-2">
              {errors.map((error) => (
                <p
                  key={`${error.code}-${error.fieldKey ?? "general"}`}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error.message}
                </p>
              ))}
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div className="mt-4 space-y-2">
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
        </>
      ) : (
        <>
          <h2 className="mt-2 text-lg font-semibold">No CSV loaded</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload a valid CSV to unlock template selection. The file stays in
            this browser session only.
          </p>
        </>
      )}
    </section>
  );
}
