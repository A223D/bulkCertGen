import { describe, expect, it } from "vitest";
import { analyzeCsvInsights } from "../../lib/batch-pdf/csv-insights.ts";

describe("analyzeCsvInsights", () => {
  it("flags columns that are empty in every row", () => {
    const insights = analyzeCsvInsights({
      headers: ["name", "seat"],
      rows: [
        { name: "Ada", seat: "" },
        { name: "Grace", seat: " " },
      ],
      rowCount: 2,
    });

    expect(insights).toContainEqual({
      code: "empty_column",
      severity: "warning",
      message: '"seat" is empty in every row.',
    });
  });

  it("flags mostly empty columns for larger spreadsheets", () => {
    const insights = analyzeCsvInsights({
      headers: ["name", "notes"],
      rows: [
        { name: "A", notes: "" },
        { name: "B", notes: "" },
        { name: "C", notes: "" },
        { name: "D", notes: "" },
        { name: "E", notes: "VIP" },
      ],
      rowCount: 5,
    });

    expect(insights.some((insight) => insight.code === "mostly_empty_column")).toBe(true);
  });

  it("counts rows that duplicate an earlier row", () => {
    const insights = analyzeCsvInsights({
      headers: ["name", "role"],
      rows: [
        { name: "Ada", role: "Speaker" },
        { name: "Grace", role: "Guest" },
        { name: "Ada", role: "Speaker" },
        { name: "Ada", role: "Speaker" },
      ],
      rowCount: 4,
    });

    expect(insights).toContainEqual({
      code: "duplicate_rows",
      severity: "info",
      message: "2 rows look identical to an earlier row.",
    });
  });
});
