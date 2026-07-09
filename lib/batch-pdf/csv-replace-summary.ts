import type { CustomFieldBox } from "./custom/types.ts";

export type CsvReplacementSummary = {
  matchedCsvFieldCount: number;
  orphanedCsvFieldCount: number;
  notice: string;
};

export function summarizeCsvReplacement(args: {
  previousFileName: string;
  previousRowCount: number;
  nextFileName: string;
  nextRowCount: number;
  nextHeaders: string[];
  fieldBoxes: CustomFieldBox[];
}): CsvReplacementSummary {
  const nextHeaders = new Set(args.nextHeaders);
  const csvBoxes = args.fieldBoxes.filter((box) => box.source.type === "csvColumn");
  const matchedCsvFieldCount = csvBoxes.filter(
    (box) => box.source.type === "csvColumn" && nextHeaders.has(box.source.column),
  ).length;
  const orphanedCsvFieldCount = csvBoxes.length - matchedCsvFieldCount;

  return {
    matchedCsvFieldCount,
    orphanedCsvFieldCount,
    notice: `Replaced ${args.previousFileName} (${args.previousRowCount} rows) with ${args.nextFileName} (${args.nextRowCount} rows). ${matchedCsvFieldCount} field${matchedCsvFieldCount !== 1 ? "s" : ""} matched${orphanedCsvFieldCount > 0 ? `; ${orphanedCsvFieldCount} need a new column.` : "."}`,
  };
}
