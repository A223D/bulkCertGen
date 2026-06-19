import type { CustomDesignPreflightResult, PreflightIssue } from "./preflight.ts";

// ---------------------------------------------------------------------------
// Privacy-safe preflight report
// ---------------------------------------------------------------------------

const REPORT_COLUMNS = [
  "severity",
  "code",
  "row_number",
  "field_label",
  "source_column",
  "value_length",
  "message",
] as const;

export const PREFLIGHT_REPORT_FILENAME = "preflight-report.csv";

function escapeCsvCell(value: string): string {
  // Quote the cell when it contains a comma, quote, or newline. Inner quotes
  // are doubled per RFC 4180.
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function issueToRow(issue: PreflightIssue): string[] {
  return [
    issue.severity,
    issue.code,
    typeof issue.rowIndex === "number" ? String(issue.rowIndex + 1) : "",
    issue.fieldLabel ?? "",
    issue.sourceColumn ?? "",
    typeof issue.valueLength === "number" ? String(issue.valueLength) : "",
    issue.message ?? "",
  ];
}

/**
 * Builds a privacy-safe CSV report from a preflight result.
 *
 * The report never contains raw CSV values or static text — only the
 * structural metadata captured by the preflight engine (severity, code, row
 * number, field label, source column, value length, and a safe message).
 */
export function createPreflightReportCsv(args: {
  result: CustomDesignPreflightResult;
}): string {
  const { result } = args;
  const lines: string[] = [];

  lines.push(REPORT_COLUMNS.join(","));

  if (result.issues.length === 0) {
    const summary = `No issues found. ${result.summary.rowCount} rows checked.`;
    lines.push(
      [
        "info",
        "no_issues",
        "",
        "",
        "",
        "",
        summary,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
    return lines.join("\r\n");
  }

  for (const issue of result.issues) {
    lines.push(issueToRow(issue).map(escapeCsvCell).join(","));
  }

  return lines.join("\r\n");
}
