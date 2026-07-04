import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSessionCsv, saveSessionCsv } from "../../lib/batch-pdf/session-csv.ts";
import type { CsvParseResult } from "../../lib/batch-pdf/types.ts";

function installSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session CSV handoff", () => {
  it("round-trips truncation warnings and total row metadata", () => {
    installSessionStorage();
    const csv: CsvParseResult = {
      headers: ["name"],
      rows: [{ name: "Alice" }],
      totalDataRows: 620,
      rowCount: 500,
      warnings: [
        {
          code: "csv_rows_truncated",
          message: "Only the first 500 rows will be processed.",
          totalRows: 620,
          processedRows: 500,
          droppedRows: 120,
        },
      ],
    };

    saveSessionCsv(csv, "people.csv");
    const loaded = loadSessionCsv();
    expect(loaded?.fileName).toBe("people.csv");
    expect(loaded?.asCsvResult()).toMatchObject({
      totalDataRows: 620,
      warnings: [
        {
          code: "csv_rows_truncated",
          totalRows: 620,
          processedRows: 500,
          droppedRows: 120,
        },
      ],
    });
  });
});
