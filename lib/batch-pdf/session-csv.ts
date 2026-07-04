import type { CsvParseResult } from "./types";

const SESSION_KEY = "batch_pdf_csv_v1";

type StoredCsv = {
  headers: string[];
  rows: Record<string, string>[];
  totalDataRows?: number;
  warnings?: CsvParseResult["warnings"];
  fileName: string;
};

export function saveSessionCsv(csv: CsvParseResult, fileName: string): void {
  try {
    const data: StoredCsv = {
      headers: csv.headers,
      rows: csv.rows,
      totalDataRows: csv.totalDataRows,
      warnings: csv.warnings,
      fileName,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (private browsing, quota exceeded, etc.)
  }
}

export function loadSessionCsv(): (StoredCsv & { asCsvResult: () => CsvParseResult }) | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredCsv;
    if (!Array.isArray(data.headers) || !Array.isArray(data.rows)) return null;
    return {
      ...data,
      asCsvResult: (): CsvParseResult => ({
        headers: data.headers,
        rows: data.rows,
        totalDataRows:
          typeof data.totalDataRows === "number" && Number.isFinite(data.totalDataRows)
            ? data.totalDataRows
            : data.rows.length,
        rowCount: data.rows.length,
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
      }),
    };
  } catch {
    return null;
  }
}

export function clearSessionCsv(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
