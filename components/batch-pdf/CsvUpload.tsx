"use client";

import { useMemo, useRef, useState } from "react";
import { BATCH_PDF_LIMITS } from "@/lib/batch-pdf/limits";
import { parseCsvText, validateCsvFile } from "@/lib/batch-pdf/csv";
import type { CsvParseResult } from "@/lib/batch-pdf/types";

type FileMeta = {
  name: string;
  size: number;
};

type CsvUploadProps = {
  csv: CsvParseResult | null;
  onCsvParsed: (csv: CsvParseResult) => void;
  onCsvReset: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadErrorMessage(message: string): string {
  return `${message} No batch was loaded or exported.`;
}

export function CsvUpload({ csv, onCsvParsed, onCsvReset }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const previewRows = useMemo(() => csv?.rows.slice(0, 3) ?? [], [csv]);

  function resetUpload() {
    setFileMeta(null);
    setError(null);
    setIsParsing(false);
    onCsvReset();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileMeta({ name: file.name, size: file.size });
    setError(null);
    onCsvReset();

    const fileValidation = validateCsvFile(file);

    if (!fileValidation.ok) {
      setError(
        getUploadErrorMessage(
          fileValidation.errors[0]?.message ?? "Unable to use this CSV file.",
        ),
      );
      event.target.value = "";
      return;
    }

    setIsParsing(true);

    try {
      const text = await file.text();
      const parsed = parseCsvText(text);

      if (!parsed.ok) {
        setError(
          getUploadErrorMessage(
            parsed.errors[0]?.message ?? "Unable to parse this CSV file.",
          ),
        );
        return;
      }

      onCsvParsed(parsed.value);
    } catch {
      setError(
        getUploadErrorMessage(
          "Unable to read this CSV file. Try exporting it from your spreadsheet app again.",
        ),
      );
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Upload CSV
          </p>
          <h2 className="mt-2 text-lg font-semibold">Start with a spreadsheet export</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your CSV is used only to generate your PDFs. We do not store
            uploaded spreadsheets or generated PDF files.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
          Limit: {BATCH_PDF_LIMITS.maxRowsParsed} rows,{" "}
          {BATCH_PDF_LIMITS.maxColumns} columns,{" "}
          {formatFileSize(BATCH_PDF_LIMITS.maxCsvFileSizeBytes)} max
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          htmlFor="batch-pdf-csv-upload"
          className="inline-flex w-fit cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-medium text-panel hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Choose CSV
        </label>
        <input
          ref={inputRef}
          id="batch-pdf-csv-upload"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={handleUpload}
          aria-describedby="batch-pdf-csv-help"
        />
        {csv || fileMeta ? (
          <button
            type="button"
            onClick={resetUpload}
            className="inline-flex w-fit rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Clear upload
          </button>
        ) : null}
      </div>
      <p id="batch-pdf-csv-help" className="mt-3 text-xs leading-5 text-muted-foreground">
        Use a `.csv` file with one header row. Rows are sent to the server only
        when you click Generate free ZIP.
      </p>

      {fileMeta ? (
        <div className="mt-4 rounded-lg border border-line bg-muted p-3 text-sm text-muted-foreground">
          <span className="font-medium text-ink">{fileMeta.name}</span>
          <span className="ml-2">{formatFileSize(fileMeta.size)}</span>
        </div>
      ) : null}

      {isParsing ? (
        <p className="mt-4 text-sm font-medium text-muted-foreground" role="status">
          Reading your CSV...
        </p>
      ) : null}

      {error ? (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {csv ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Rows
              </p>
              <p className="mt-1 text-2xl font-semibold">{csv.rowCount}</p>
            </div>
            <div className="rounded-lg border border-line bg-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Columns
              </p>
              <p className="mt-1 text-2xl font-semibold">{csv.headers.length}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground" role="status">
            CSV loaded for this session. Choose a template next, or clear the
            upload to start over.
          </p>

          <div className="overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    {csv.headers.map((header) => (
                      <th key={header} className="px-3 py-3">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-panel">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {csv.headers.map((header) => (
                        <td key={header} className="max-w-56 truncate px-3 py-3 text-muted-foreground">
                          {row[header] || <span className="text-muted-foreground/70">Blank</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
