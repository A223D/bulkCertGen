"use client";

import type {
  BatchPdfError,
  BatchPdfTemplate,
  BatchPdfWarning,
  FieldMapping,
} from "@/lib/batch-pdf/types";

type FieldMapperProps = {
  template: BatchPdfTemplate;
  headers: string[];
  mapping: FieldMapping;
  errors: BatchPdfError[];
  warnings: BatchPdfWarning[];
  isValid: boolean;
  onMappingChange: (fieldKey: string, csvHeader: string) => void;
  onContinue: () => void;
};

function getFieldMessages<T extends { fieldKey?: string }>(
  messages: T[],
  fieldKey: string,
): T[] {
  return messages.filter((message) => message.fieldKey === fieldKey);
}

export function FieldMapper({
  template,
  headers,
  mapping,
  errors,
  warnings,
  isValid,
  onMappingChange,
  onContinue,
}: FieldMapperProps) {
  return (
    <section className="space-y-4" aria-labelledby="field-mapper-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Map fields
          </p>
          <h2 id="field-mapper-heading" className="mt-2 text-xl font-semibold">
            Connect CSV columns to {template.shortName} fields
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Auto-mapping uses template aliases. Review each match before moving
            to preview.
          </p>
          {!isValid ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Continue is disabled until every required field has a CSV column.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!isValid}
          onClick={onContinue}
          className={[
            "inline-flex w-fit rounded-lg px-4 py-2 text-sm font-medium",
            isValid
              ? "bg-ink text-panel hover:bg-accent"
              : "cursor-not-allowed bg-disabled text-disabled-foreground",
          ].join(" ")}
        >
          Continue to preview
        </button>
      </div>

      <div className="space-y-3">
        {template.fields.map((field) => {
          const fieldErrors = getFieldMessages(errors, field.key);
          const fieldWarnings = getFieldMessages(warnings, field.key);

          return (
            <div key={field.key} className="rounded-lg border border-line bg-panel p-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{field.label}</h3>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {field.required ? "Required" : "Optional"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {field.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {field.helpText ??
                      `Map to a CSV column such as ${field.aliases.slice(0, 3).join(", ")}.`}
                  </p>
                  {field.placeholder ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Example: {field.placeholder}
                    </p>
                  ) : null}
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-ink">CSV column</span>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(event) => onMappingChange(field.key, event.target.value)}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={
                      fieldErrors.length > 0 || fieldWarnings.length > 0
                        ? `${field.key}-messages`
                        : undefined
                    }
                    className="mt-2 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  >
                    <option value="">
                      {field.required ? "Choose column" : "Not mapped"}
                    </option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {fieldErrors.length > 0 || fieldWarnings.length > 0 ? (
                <div id={`${field.key}-messages`} className="mt-4 space-y-2">
                  {fieldErrors.map((error) => (
                    <p
                      key={`${field.key}-${error.code}-${error.message}`}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                      role="alert"
                    >
                      {error.message}
                    </p>
                  ))}
                  {fieldWarnings.map((warning) => (
                    <p
                      key={`${field.key}-${warning.code}-${warning.message}`}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                      role="status"
                    >
                      {warning.message}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
