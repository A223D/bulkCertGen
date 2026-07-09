import type { CsvParseResult } from "./types.ts";

export type CsvInsight = {
  code: "empty_column" | "mostly_empty_column" | "duplicate_rows";
  severity: "info" | "warning";
  message: string;
};

function isBlank(value: string | undefined): boolean {
  return (value ?? "").trim() === "";
}

export function analyzeCsvInsights(
  csv: Pick<CsvParseResult, "headers" | "rows" | "rowCount">,
): CsvInsight[] {
  const insights: CsvInsight[] = [];

  for (const header of csv.headers) {
    const blankCount = csv.rows.filter((row) => isBlank(row[header])).length;

    if (blankCount === csv.rows.length && csv.rows.length > 0) {
      insights.push({
        code: "empty_column",
        severity: "warning",
        message: `"${header}" is empty in every row.`,
      });
      continue;
    }

    if (csv.rows.length >= 5 && blankCount / csv.rows.length >= 0.8) {
      insights.push({
        code: "mostly_empty_column",
        severity: "info",
        message: `"${header}" is blank in most rows.`,
      });
    }
  }

  const seen = new Map<string, number>();
  let duplicateRows = 0;

  for (const row of csv.rows) {
    const signature = JSON.stringify(csv.headers.map((header) => row[header] ?? ""));
    const count = seen.get(signature) ?? 0;
    if (count > 0) duplicateRows += 1;
    seen.set(signature, count + 1);
  }

  if (duplicateRows > 0) {
    insights.push({
      code: "duplicate_rows",
      severity: "info",
      message: `${duplicateRows} row${duplicateRows !== 1 ? "s look" : " looks"} identical to an earlier row.`,
    });
  }

  return insights;
}
