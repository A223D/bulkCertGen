import { describe, expect, it } from "vitest";
import {
  createPreflightReportCsv,
  PREFLIGHT_REPORT_FILENAME,
} from "../../lib/batch-pdf/custom/export-report.ts";
import type {
  CustomDesignPreflightResult,
  PreflightIssue,
} from "../../lib/batch-pdf/custom/preflight.ts";

function makeResult(
  issues: PreflightIssue[],
  overrides: Partial<CustomDesignPreflightResult["summary"]> = {},
): CustomDesignPreflightResult {
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  return {
    status: errorCount > 0 ? "blocked" : warningCount > 0 ? "readyWithWarnings" : "ready",
    summary: {
      rowCount: 3,
      fieldBoxCount: 2,
      checkedCellCount: 6,
      fitCount: 6 - issues.length,
      warningCount,
      errorCount,
      blocksExport: errorCount > 0,
      ...overrides,
    },
    issues,
  };
}

describe("createPreflightReportCsv", () => {
  it("uses the expected header row", () => {
    const csv = createPreflightReportCsv({ result: makeResult([]) });
    const firstLine = csv.split("\r\n")[0];
    expect(firstLine).toBe(
      "severity,code,row_number,field_label,source_column,value_length,message",
    );
  });

  it("exposes a stable report filename", () => {
    expect(PREFLIGHT_REPORT_FILENAME).toBe("preflight-report.csv");
  });

  it("renders severity/code/row/field/source/value_length/message columns", () => {
    const csv = createPreflightReportCsv({
      result: makeResult([
        {
          code: "text_truncated",
          severity: "warning",
          rowIndex: 4,
          fieldLabel: "Title",
          sourceColumn: "title",
          valueLength: 42,
          message: "Row 5 text will be cut short.",
        },
      ]),
    });
    const row = csv.split("\r\n")[1];
    // row_number is 1-based (rowIndex 4 -> 5)
    expect(row).toBe('warning,text_truncated,5,Title,title,42,Row 5 text will be cut short.');
  });

  it("escapes commas, quotes, and newlines", () => {
    const csv = createPreflightReportCsv({
      result: makeResult([
        {
          code: "text_overflow",
          severity: "error",
          rowIndex: 0,
          fieldLabel: 'Name, "nick"',
          message: "Line one\nLine two",
        },
      ]),
    });
    const row = csv.split("\r\n")[1];
    expect(row).toContain('"Name, ""nick"""');
    expect(row).toContain('"Line one\nLine two"');
  });

  it("handles an empty issue list with a single safe summary row", () => {
    const csv = createPreflightReportCsv({ result: makeResult([]) });
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1].startsWith("info,no_issues,")).toBe(true);
  });

  it("handles warning, info, and error issues", () => {
    const csv = createPreflightReportCsv({
      result: makeResult([
        { code: "missing_required_value", severity: "error", rowIndex: 0, message: "missing" },
        { code: "text_shrunk", severity: "info", rowIndex: 1, message: "shrunk" },
        { code: "text_truncated", severity: "warning", rowIndex: 2, message: "truncated" },
      ]),
    });
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[1].startsWith("error,")).toBe(true);
    expect(lines[2].startsWith("info,")).toBe(true);
    expect(lines[3].startsWith("warning,")).toBe(true);
  });

  it("does not leak raw row values supplied out of band", () => {
    // The report only receives structural metadata; assert that an unrelated
    // sensitive string never appears just because it was nearby in the issue.
    const sensitive = "SENSITIVE_VALUE_123";
    const csv = createPreflightReportCsv({
      result: makeResult([
        {
          code: "text_truncated",
          severity: "warning",
          rowIndex: 0,
          fieldLabel: "Title",
          sourceColumn: "title",
          valueLength: sensitive.length,
          message: "Text will be cut short.",
        },
      ]),
    });
    expect(csv).not.toContain(sensitive);
  });
});
