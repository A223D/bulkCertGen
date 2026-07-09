import Papa from "papaparse";
import { BATCH_PDF_LIMITS } from "./limits.ts";
import { normalizePrintableText } from "./text-normalization.ts";
import type { CsvParseResult, CsvRow, Result } from "./types.ts";

function csvError(code: string, message: string): Result<never> {
  return {
    ok: false,
    errors: [{ code, message }],
  };
}

export function normalizeHeader(header: string): string {
  return header.trim();
}

export function normalizeCellValue(value: unknown): string {
  return normalizePrintableText(value);
}

export function validateCsvFile(file: File): Result<File> {
  if (!file) {
    return csvError("csv_file_missing", "Choose a CSV file to upload.");
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return csvError("csv_invalid_extension", "Upload a file with a .csv extension.");
  }

  if (file.size === 0) {
    return csvError("csv_empty_file", "This CSV file is empty.");
  }

  if (file.size > BATCH_PDF_LIMITS.maxCsvFileSizeBytes) {
    return csvError(
      "csv_file_too_large",
      "This file is too large. Upload a CSV under 2 MB.",
    );
  }

  return { ok: true, value: file };
}

export function parseCsvText(text: string): Result<CsvParseResult> {
  if (text.trim() === "") {
    return csvError(
      "csv_empty_file",
      "We could not read this CSV. Make sure it has a header row and at least one data row.",
    );
  }

  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  const blockingParseErrors = parsed.errors.filter(
    (error) => error.code !== "UndetectableDelimiter",
  );

  if (blockingParseErrors.length > 0) {
    return csvError(
      "csv_parse_failed",
      "We could not read this CSV. Check the file format and try again.",
    );
  }

  const rawRows = parsed.data.filter((row) =>
    row.some((cell) => normalizeCellValue(cell) !== ""),
  );

  if (rawRows.length === 0) {
    return csvError(
      "csv_empty_file",
      "We could not read this CSV. Make sure it has a header row and at least one data row.",
    );
  }

  const rawHeaders = rawRows[0] ?? [];
  const headers = rawHeaders.map((header) => normalizeHeader(header));

  if (headers.length === 0 || headers.every((header) => header === "")) {
    return csvError(
      "csv_missing_header",
      "This CSV needs a header row before any data rows.",
    );
  }

  // Title-row detection: if row 1 has only one non-empty cell (a title) and
  // the next row has more cells, the user likely has a title line above the
  // real headers.
  const nonEmptyHeaderCount = headers.filter((h) => h !== "").length;
  const nextRow = rawRows[1] ?? [];
  const nextRowCellCount = nextRow.filter((c) => normalizeCellValue(c) !== "").length;

  if (nonEmptyHeaderCount <= 1 && nextRowCellCount > 1) {
    return csvError(
      "csv_title_row",
      "Row 1 looks like a title, not column headers. Delete the title row so the first row contains your column names (like name, course, date).",
    );
  }

  if (headers.some((header) => header === "")) {
    return csvError("csv_blank_header", "Every CSV column needs a header.");
  }

  if (headers.length > BATCH_PDF_LIMITS.maxColumns) {
    return csvError(
      "csv_too_many_columns",
      `This CSV has too many columns. Use ${BATCH_PDF_LIMITS.maxColumns} columns or fewer.`,
    );
  }

  if (new Set(headers).size !== headers.length) {
    return csvError("csv_duplicate_header", "CSV column headers must be unique.");
  }

  const allDataRows = rawRows.slice(1);

  if (allDataRows.length === 0) {
    return csvError(
      "csv_missing_rows",
      "This CSV has headers but no data rows.",
    );
  }

  // Process the first N rows; anything beyond the limit is left out (with a
  // warning) rather than rejecting the whole file.
  const warnings: CsvParseResult["warnings"] = [];
  const dataRows = allDataRows.slice(0, BATCH_PDF_LIMITS.maxRowsParsed);

  if (allDataRows.length > BATCH_PDF_LIMITS.maxRowsParsed) {
    warnings.push({
      code: "csv_rows_truncated",
      message: `This CSV has ${allDataRows.length} rows. Only the first ${BATCH_PDF_LIMITS.maxRowsParsed} will be processed.`,
      totalRows: allDataRows.length,
      processedRows: BATCH_PDF_LIMITS.maxRowsParsed,
      droppedRows: allDataRows.length - BATCH_PDF_LIMITS.maxRowsParsed,
    });
  }

  const rows: CsvRow[] = [];

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const rawRow = dataRows[rowIndex] ?? [];

    if (rawRow.length > headers.length) {
      const trailingCells = rawRow.slice(headers.length);
      const allTrailingEmpty = trailingCells.every((c) => normalizeCellValue(c) === "");
      if (!allTrailingEmpty) {
        return csvError(
          "csv_row_too_wide",
          `Row ${rowIndex + 2} has more cells than the header row. Make sure every row has the same number of columns as the headers.`,
        );
      }
    }

    const row: CsvRow = {};

    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const value = normalizeCellValue(rawRow[columnIndex]);

      if (value.length > BATCH_PDF_LIMITS.maxFieldLength) {
        return csvError(
          "csv_field_too_long",
          `A CSV value is too long at row ${rowIndex + 2}, column ${columnIndex + 1}. Keep values under ${BATCH_PDF_LIMITS.maxFieldLength} characters.`,
        );
      }

      row[headers[columnIndex]] = value;
    }

    rows.push(row);
  }

  return {
    ok: true,
    value: {
      headers,
      rows,
      totalDataRows: allDataRows.length,
      rowCount: rows.length,
      warnings,
    },
  };
}
