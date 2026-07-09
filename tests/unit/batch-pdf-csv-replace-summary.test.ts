import { describe, expect, it } from "vitest";
import { summarizeCsvReplacement } from "../../lib/batch-pdf/csv-replace-summary.ts";
import { createDefaultTextBoxStyle } from "../../lib/batch-pdf/custom/field-boxes.ts";
import type { CustomFieldBox } from "../../lib/batch-pdf/custom/types.ts";

function csvBox(column: string, id = column): CustomFieldBox {
  return {
    id,
    label: column,
    source: { type: "csvColumn", column },
    rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
    style: createDefaultTextBoxStyle(),
    required: false,
  };
}

function staticBox(): CustomFieldBox {
  return {
    id: "static",
    label: "VIP",
    source: { type: "staticText", value: "VIP" },
    rect: { x: 0.1, y: 0.3, width: 0.2, height: 0.1 },
    style: createDefaultTextBoxStyle(),
    required: false,
  };
}

describe("summarizeCsvReplacement", () => {
  it("counts matching and orphaned CSV-backed field boxes", () => {
    const summary = summarizeCsvReplacement({
      previousFileName: "old.csv",
      previousRowCount: 10,
      nextFileName: "new.csv",
      nextRowCount: 8,
      nextHeaders: ["name", "email"],
      fieldBoxes: [csvBox("name"), csvBox("role"), staticBox()],
    });

    expect(summary.matchedCsvFieldCount).toBe(1);
    expect(summary.orphanedCsvFieldCount).toBe(1);
    expect(summary.notice).toBe(
      "Replaced old.csv (10 rows) with new.csv (8 rows). 1 field matched; 1 need a new column.",
    );
  });

  it("ignores static text boxes and pluralizes matched fields", () => {
    const summary = summarizeCsvReplacement({
      previousFileName: "old.csv",
      previousRowCount: 1,
      nextFileName: "new.csv",
      nextRowCount: 2,
      nextHeaders: ["name", "role"],
      fieldBoxes: [csvBox("name"), csvBox("role"), staticBox()],
    });

    expect(summary.matchedCsvFieldCount).toBe(2);
    expect(summary.orphanedCsvFieldCount).toBe(0);
    expect(summary.notice).toBe(
      "Replaced old.csv (1 rows) with new.csv (2 rows). 2 fields matched.",
    );
  });
});
