"use client";

import { useMemo, useEffect } from "react";
import { PreflightSummary } from "./PreflightSummary";
import { PreflightIssueList, type DisplayIssue } from "./PreflightIssueList";
import {
  getFieldBoxTextForRow,
  runCustomDesignPreflight,
} from "@/lib/batch-pdf/custom/preflight";
import type {
  CustomFieldBox,
  DesignAsset,
  ExportOptions,
} from "@/lib/batch-pdf/custom/types";
import type { CustomDesignPreflightResult } from "@/lib/batch-pdf/custom/preflight";
import type { CsvRow } from "@/lib/batch-pdf/types";

const MAX_DISPLAY_ISSUES = 100;

type Props = {
  design: DesignAsset;
  rows: CsvRow[];
  csvHeaders: string[];
  fieldBoxes: CustomFieldBox[];
  // Export options are owned by the parent; this panel only displays results
  // computed against them so preflight and export share one source of truth.
  exportOptions: ExportOptions;
  onPreflightResultChange?: (result: CustomDesignPreflightResult | null) => void;
};

export function CustomPreflightPanel({
  design,
  rows,
  csvHeaders,
  fieldBoxes,
  exportOptions,
  onPreflightResultChange,
}: Props) {
  const preflightResult = useMemo(() => {
    if (rows.length === 0) return null;

    const result = runCustomDesignPreflight({
      design,
      rows,
      fieldBoxes,
      exportOptions,
      csvHeaders,
    });

    return result.ok ? result.value : null;
  }, [design, rows, csvHeaders, fieldBoxes, exportOptions]);

  // Notify parent whenever preflight result changes.
  useEffect(() => {
    onPreflightResultChange?.(preflightResult);
  }, [preflightResult, onPreflightResultChange]);

  if (!preflightResult) {
    return (
      <section className="rounded-lg border border-line bg-panel p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Text fit
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Upload a CSV with rows to check whether text fits.
        </p>
      </section>
    );
  }

  const shown = preflightResult.issues.slice(0, MAX_DISPLAY_ISSUES);
  const hiddenIssueCount = preflightResult.issues.length - shown.length;

  // Resolve the actual offending text for each issue. This stays in the browser
  // (the CSV is already here) so the user sees exactly what does not fit — the
  // privacy-safe preflight result still carries no raw values.
  const boxById = new Map(fieldBoxes.map((box) => [box.id, box]));
  const displayItems: DisplayIssue[] = shown.map((issue) => {
    if (typeof issue.rowIndex !== "number" || !issue.fieldBoxId) {
      return { issue };
    }
    const box = boxById.get(issue.fieldBoxId);
    const row = rows[issue.rowIndex];
    if (!box || !row) return { issue };
    return { issue, sampleText: getFieldBoxTextForRow({ row, box }).text };
  });

  return (
    <section className="space-y-4 rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Text fit
      </p>

      <PreflightSummary result={preflightResult} />

      {displayItems.length > 0 ? (
        <PreflightIssueList items={displayItems} hiddenCount={hiddenIssueCount} />
      ) : null}
    </section>
  );
}
