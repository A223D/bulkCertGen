"use client";

import { useMemo, useState, useEffect } from "react";
import { PreflightSummary } from "./PreflightSummary";
import { PreflightIssueList } from "./PreflightIssueList";
import { runCustomDesignPreflight } from "@/lib/batch-pdf/custom/preflight";
import { createDefaultExportOptions } from "@/lib/batch-pdf/custom/export-options";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "@/lib/batch-pdf/custom/types";
import type { CsvRow } from "@/lib/batch-pdf/types";

const MAX_DISPLAY_ISSUES = 100;

type Props = {
  design: DesignAsset;
  rows: CsvRow[];
  csvHeaders: string[];
  fieldBoxes: CustomFieldBox[];
};

export function CustomPreflightPanel({ design, rows, csvHeaders, fieldBoxes }: Props) {
  const isImageDesign = design.intrinsicUnit === "px";

  const [widthIn, setWidthIn] = useState("");
  const [heightIn, setHeightIn] = useState("");

  // Reset size inputs when the design file changes.
  useEffect(() => {
    setWidthIn("");
    setHeightIn("");
  }, [design.fileName, design.sizeBytes]);

  const exportOptions = useMemo((): ExportOptions => {
    if (!isImageDesign) return createDefaultExportOptions();
    const w = parseFloat(widthIn);
    const h = parseFloat(heightIn);
    if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) {
      return {
        ...createDefaultExportOptions(),
        itemSizeMode: "custom",
        customItemWidth: w,
        customItemHeight: h,
        unit: "in",
      };
    }
    return createDefaultExportOptions();
  }, [isImageDesign, widthIn, heightIn]);

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

  if (!preflightResult) {
    return (
      <section className="rounded-lg border border-line bg-panel p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Preflight
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Upload a CSV with rows to run preflight checks.
        </p>
      </section>
    );
  }

  const displayIssues = preflightResult.issues.slice(0, MAX_DISPLAY_ISSUES);
  const hiddenIssueCount = preflightResult.issues.length - displayIssues.length;

  return (
    <section className="space-y-4 rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Preflight
      </p>

      {isImageDesign ? (
        <div className="space-y-2">
          <p className="text-xs leading-5 text-muted-foreground">
            Enter the intended print size so text fit can be checked.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Width (in)</label>
              <input
                type="number"
                min="0.5"
                max="48"
                step="0.125"
                value={widthIn}
                onChange={(e) => setWidthIn(e.target.value)}
                placeholder="e.g. 11"
                className="w-full rounded border border-line bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Height (in)</label>
              <input
                type="number"
                min="0.5"
                max="48"
                step="0.125"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full rounded border border-line bg-background px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      ) : null}

      <PreflightSummary result={preflightResult} />

      {displayIssues.length > 0 ? (
        <PreflightIssueList issues={displayIssues} hiddenCount={hiddenIssueCount} />
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">
        Export comes next. Fix blocking issues before export is enabled.
      </p>
    </section>
  );
}
