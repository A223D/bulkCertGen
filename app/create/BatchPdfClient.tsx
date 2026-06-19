"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UtilityStepper } from "@/components/batch-pdf/UtilityStepper";
import type { WizardStep } from "@/components/batch-pdf/UtilityStepper";
import { CustomDesignUpload } from "@/components/batch-pdf/custom/CustomDesignUpload";
import { CustomDesignPreview } from "@/components/batch-pdf/custom/CustomDesignPreview";
import { CustomFieldPlacementEditor } from "@/components/batch-pdf/custom/CustomFieldPlacementEditor";
import { CustomPreflightPanel } from "@/components/batch-pdf/custom/CustomPreflightPanel";
import { CustomExportOptionsPanel } from "@/components/batch-pdf/custom/CustomExportOptionsPanel";
import { TemplatePreviewRenderer } from "@/components/batch-pdf/previews/TemplatePreviewRenderer";
import {
  autoMapFields,
  getMissingValueWarnings,
  mapRowToTemplateData,
  validateMapping,
} from "@/lib/batch-pdf/mapping";
import { clampPreviewRowIndex } from "@/lib/batch-pdf/preview";
import { getAllTemplates, getTemplateById } from "@/lib/batch-pdf/template-registry";
import { loadSessionCsv } from "@/lib/batch-pdf/session-csv";
import {
  createEmptyCustomDesignState,
  isCustomDesignPreviewReady,
  resetCustomDesignState,
} from "@/lib/batch-pdf/custom/design-upload-state";
import type {
  CustomDesignPreviewStatus,
  CustomDesignState,
} from "@/lib/batch-pdf/custom/design-upload-state";
import { isCustomFieldPlacementReady } from "@/lib/batch-pdf/custom/field-box-state";
import {
  createDefaultExportOptions,
  measurementToPoints,
  resolveExportItemSizePoints,
  resolveSheetPageSizePoints,
} from "@/lib/batch-pdf/custom/export-options";
import { calculateSheetLayout, type SheetLayoutResult } from "@/lib/batch-pdf/custom/sheet-layout";
import { BATCH_PDF_LIMITS } from "@/lib/batch-pdf/limits";
import type { BatchPdfError, CsvParseResult, CsvRow, FieldMapping } from "@/lib/batch-pdf/types";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "@/lib/batch-pdf/custom/types";
import type { CustomDesignPreflightResult } from "@/lib/batch-pdf/custom/preflight";

// ── Types ─────────────────────────────────────────────────────────────────────

type BatchPdfStep =
  | "choose-design"
  | "setup-design"
  | "mapping"
  | "preview"
  | "export-options"
  | "export";
type WorkflowMode = "starterTemplate" | "customDesign";
type ExportStatus = "idle" | "loading" | "success" | "error";

type SessionState = {
  step: BatchPdfStep;
  workflowMode: WorkflowMode | null;
  csv: CsvParseResult | null;
  csvFileName: string;
  selectedTemplateId: string | null;
  mapping: FieldMapping;
  previewRowIndex: number;
  customDesign: CustomDesignState;
  customExportOptions: ExportOptions;
  customPreflightResult: CustomDesignPreflightResult | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STARTER_STEP_ORDER: BatchPdfStep[] = [
  "choose-design",
  "setup-design",
  "mapping",
  "preview",
  "export",
];

const CUSTOM_STEP_ORDER: BatchPdfStep[] = [
  "choose-design",
  "setup-design",
  "mapping",
  "preview",
  "export-options",
  "export",
];

const STEP_LABELS: Record<BatchPdfStep, string> = {
  "choose-design": "Choose design",
  "setup-design": "Set up design",
  mapping: "Map fields",
  preview: "Preview",
  "export-options": "Export setup",
  export: "Export",
};

// ── Shared style helpers ──────────────────────────────────────────────────────

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
};

const STEP_LABEL_STYLE: React.CSSProperties = {
  ...MONO,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.12em",
  color: "#B58A12",
  textTransform: "uppercase",
};

const H2: React.CSSProperties = {
  fontSize: 30,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  fontWeight: 800,
  margin: "10px 0 6px",
};

const SUBTEXT: React.CSSProperties = {
  fontSize: 15.5,
  color: "#57534A",
  margin: "0 0 22px",
};

function HelpfulTip({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        background: "#FFFAEB",
        border: "1px solid #F0DFA8",
        borderRadius: 12,
        padding: "10px 12px",
        color: "#6E5410",
        fontSize: 13,
        lineHeight: 1.45,
        ...style,
      }}
    >
      <span
        style={{
          ...MONO,
          flexShrink: 0,
          borderRadius: 6,
          background: "#FBEFCB",
          color: "#8A6A12",
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: "0.06em",
          padding: "3px 6px",
          textTransform: "uppercase",
        }}
      >
        Tip
      </span>
      <span>{children}</span>
    </div>
  );
}

function ExportLoadingAnimation({
  freeRows,
  isPrintSheets,
}: {
  freeRows: number;
  isPrintSheets: boolean;
}) {
  return (
    <div style={{ textAlign: "center", padding: "18px 0 10px" }}>
      <div
        className="vs-export-loader"
        aria-hidden="true"
        style={{
          position: "relative",
          width: 128,
          height: 112,
          margin: "0 auto 20px",
        }}
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="vs-export-page"
            style={{
              position: "absolute",
              left: 36 + index * 8,
              top: 22 - index * 5,
              width: 52,
              height: 66,
              borderRadius: 9,
              background: "#FFFFFF",
              border: "1px solid #E7E2D6",
              boxShadow: "0 18px 32px -22px rgba(26,25,22,0.52)",
              transform: `rotate(${index * 5 - 5}deg)`,
              animationDelay: `${index * 0.16}s`,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 9,
                right: 9,
                top: 10,
                height: 4,
                borderRadius: 99,
                background: "#F2B01E",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                top: 25,
                width: 30,
                height: 5,
                borderRadius: 99,
                background: "#E7E2D6",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                top: 38,
                width: 22,
                height: 5,
                borderRadius: 99,
                background: "#F4F1E9",
              }}
            />
          </span>
        ))}
        <span
          className="vs-export-spark"
          style={{
            position: "absolute",
            right: 16,
            top: 10,
            width: 18,
            height: 18,
            borderRadius: 6,
            background: "#F2B01E",
            boxShadow: "0 0 0 8px rgba(242,176,30,0.14)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 4,
            height: 7,
            borderRadius: 999,
            background: "linear-gradient(90deg, #F2B01E, #1A1916, #F2B01E)",
            backgroundSize: "220% 100%",
            animation: "vsExportBar 1.4s ease-in-out infinite",
          }}
        />
      </div>
      <div style={{ fontSize: 17, fontWeight: 800 }}>
        Building your {isPrintSheets ? "print sheets" : "PDFs"}...
      </div>
      <div style={{ fontSize: 13.5, color: "#6E6A61", marginTop: 7, lineHeight: 1.45 }}>
        Personalizing {freeRows} row{freeRows !== 1 ? "s" : ""}, checking pages, and packing the ZIP.
      </div>
      <div style={{ ...MONO, fontSize: 11.5, color: "#9A9486", marginTop: 12 }}>
        This takes at least 7 seconds so the download feels steady.
      </div>
    </div>
  );
}

type FinishedSizePreset = {
  id: "letterLandscape" | "a4Landscape" | "badgeLandscape" | "custom";
  label: string;
  hint: string;
  width?: number;
  height?: number;
};

const FINISHED_SIZE_PRESETS: FinishedSizePreset[] = [
  {
    id: "letterLandscape",
    label: "Letter certificate",
    hint: "11 x 8.5 in",
    width: 11,
    height: 8.5,
  },
  {
    id: "a4Landscape",
    label: "A4 certificate",
    hint: "11.7 x 8.3 in",
    width: 11.69,
    height: 8.27,
  },
  {
    id: "badgeLandscape",
    label: "Badge / small card",
    hint: "4 x 3 in",
    width: 4,
    height: 3,
  },
  {
    id: "custom",
    label: "Custom size",
    hint: "Enter width and height",
  },
];

const MIN_EXPORT_LOADING_MS = 7000;

type SheetLayoutInfo = {
  layout: SheetLayoutResult;
  pageWidthPt: number;
  pageHeightPt: number;
  itemWidthPt: number;
  itemHeightPt: number;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForMinimumExportLoading(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  await wait(Math.max(0, MIN_EXPORT_LOADING_MS - elapsed));
}

// ── Thumbnail mini-previews ───────────────────────────────────────────────────

function CertThumbnail() {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div
        style={{
          width: 74,
          height: 96,
          background: "#fff",
          border: "1px solid #E7E2D6",
          borderTop: "3px solid #F2B01E",
          borderRadius: 6,
          boxShadow: "0 8px 18px -10px rgba(0,0,0,0.25)",
          padding: "10px 8px",
          textAlign: "center",
        }}
      >
        <div style={{ ...MONO, fontSize: 4.5, letterSpacing: "0.15em", color: "#A39B8A" }}>
          CERTIFICATE
        </div>
        <div style={{ fontSize: 11, marginTop: 12 }}>Name</div>
        <div style={{ height: 2, width: 36, background: "#EFEADF", margin: "8px auto 0" }} />
        <div style={{ height: 2, width: 26, background: "#EFEADF", margin: "5px auto 0" }} />
      </div>
    </div>
  );
}

function BadgeThumbnail() {
  return (
    <div
      style={{
        width: 64,
        height: 96,
        background: "#1A1916",
        borderRadius: 6,
        boxShadow: "0 8px 18px -10px rgba(0,0,0,0.4)",
        padding: "10px 8px",
        textAlign: "center",
      }}
    >
      <div
        style={{ height: 3, width: 26, background: "#F2B01E", borderRadius: 2, margin: "0 auto 10px" }}
      />
      <div style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>Name</div>
      <div style={{ color: "#B7B1A4", fontSize: 6, marginTop: 3 }}>Role · Company</div>
    </div>
  );
}

function LabelThumbnail() {
  return (
    <div
      style={{
        width: 88,
        height: 62,
        background: "#fff",
        border: "1px solid #E7E2D6",
        borderRadius: 5,
        boxShadow: "0 4px 10px -5px rgba(0,0,0,0.2)",
        padding: "8px 10px",
      }}
    >
      <div style={{ height: 7, width: 50, background: "#1A1916", borderRadius: 2, marginBottom: 5 }} />
      <div style={{ height: 4.5, width: 68, background: "#E7E2D6", borderRadius: 2, marginBottom: 4 }} />
      <div style={{ height: 4.5, width: 50, background: "#E7E2D6", borderRadius: 2 }} />
    </div>
  );
}

function ApptThumbnail() {
  return (
    <div
      style={{
        width: 88,
        height: 56,
        background: "#1A1916",
        borderRadius: 6,
        boxShadow: "0 4px 10px -5px rgba(0,0,0,0.3)",
        padding: "7px 9px",
      }}
    >
      <div style={{ fontSize: 5.5, fontWeight: 700, color: "#F2B01E", letterSpacing: "0.1em" }}>
        APPOINTMENT
      </div>
      <div style={{ fontSize: 8, fontWeight: 700, color: "#fff", marginTop: 5 }}>Name</div>
      <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
        <div style={{ height: 4.5, width: 30, background: "#F2B01E", borderRadius: 2 }} />
        <div style={{ height: 4.5, width: 18, background: "#4A463E", borderRadius: 2 }} />
      </div>
    </div>
  );
}

function templateThumb(id: string) {
  if (id === "classic-certificate") return <CertThumbnail />;
  if (id === "name-badge") return <BadgeThumbnail />;
  if (id === "mailing-label") return <LabelThumbnail />;
  if (id === "appointment-card") return <ApptThumbnail />;
  return (
    <div
      style={{
        width: 74,
        height: 80,
        background: "#F4F1E9",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9A9486",
        fontSize: 11,
      }}
    >
      Preview
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFinishedSizePresetId(options: ExportOptions): FinishedSizePreset["id"] {
  if (
    options.unit === "in" &&
    options.itemSizeMode === "custom" &&
    typeof options.customItemWidth === "number" &&
    typeof options.customItemHeight === "number"
  ) {
    const itemWidth = options.customItemWidth;
    const itemHeight = options.customItemHeight;
    const matchingPreset = FINISHED_SIZE_PRESETS.find(
      (preset) =>
        preset.width !== undefined &&
        preset.height !== undefined &&
        Math.abs(itemWidth - preset.width) < 0.03 &&
        Math.abs(itemHeight - preset.height) < 0.03,
    );

    if (matchingPreset) {
      return matchingPreset.id;
    }
  }

  return "custom";
}

function getRecommendedFinishedSize(asset: DesignAsset): Pick<ExportOptions, "customItemWidth" | "customItemHeight" | "unit"> {
  const ratio = asset.intrinsicWidth / asset.intrinsicHeight;

  if (ratio > 1.2 && ratio < 1.4 && Math.max(asset.intrinsicWidth, asset.intrinsicHeight) < 1000) {
    return { customItemWidth: 4, customItemHeight: 3, unit: "in" };
  }

  if (ratio > 1.2 && ratio < 1.4) {
    return { customItemWidth: 11, customItemHeight: 8.5, unit: "in" };
  }

  if (ratio > 0.68 && ratio < 0.75) {
    return { customItemWidth: 4, customItemHeight: 6, unit: "in" };
  }

  return { customItemWidth: 8.5, customItemHeight: 11, unit: "in" };
}

function getBoxText(box: CustomFieldBox, row: CsvRow): string {
  const rawValue =
    box.source.type === "csvColumn" ? row[box.source.column] : box.source.value;
  const text = rawValue?.trim() ? rawValue : box.label || "Text";
  return box.style.uppercase ? text.toUpperCase() : text;
}

function cssFontFamily(fontFamily: CustomFieldBox["style"]["fontFamily"]): string {
  if (fontFamily === "Times") return "Times New Roman, serif";
  if (fontFamily === "Courier") return "Courier New, monospace";
  return "Arial, Helvetica, sans-serif";
}

function CustomDesignReviewPreview({
  file,
  asset,
  boxes,
  row,
  rowIndex,
  rowCount,
  onPrevious,
  onNext,
}: {
  file: File;
  asset: DesignAsset;
  boxes: CustomFieldBox[];
  row: CsvRow;
  rowIndex: number;
  rowCount: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const aspectRatio = asset.intrinsicWidth / asset.intrinsicHeight;
  const previewWidthByViewportHeight = `min(760px, 100%, max(300px, calc(${(aspectRatio * 100).toFixed(3)}vh - ${(aspectRatio * 19).toFixed(3)}rem)))`;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // This mirrors the uploaded File into a browser object URL and cleans it up
    // when the preview changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E7E2D6", borderRadius: 20, padding: 18, boxShadow: "0 24px 50px -34px rgba(26,25,22,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#9A9486", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preview</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 3 }}>Check how one row looks</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={onPrevious} style={{ width: 32, height: 32, border: "1px solid #E7E2D6", background: "#fff", borderRadius: 8, fontSize: 16, color: "#4A463E", cursor: "pointer" }}>‹</button>
          <span style={{ ...MONO, fontSize: 12, color: "#6E6A61", minWidth: 84, textAlign: "center" }}>row {rowIndex + 1} / {rowCount}</span>
          <button type="button" onClick={onNext} style={{ width: 32, height: 32, border: "1px solid #E7E2D6", background: "#fff", borderRadius: 8, fontSize: 16, color: "#4A463E", cursor: "pointer" }}>›</button>
        </div>
      </div>

      <div style={{ background: "#F4F1E9", border: "1px solid #EFEADF", borderRadius: 14, padding: 14 }}>
        <div
          style={{
            position: "relative",
            width: previewWidthByViewportHeight,
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: 8,
            background: "#fff",
            aspectRatio: `${asset.intrinsicWidth} / ${asset.intrinsicHeight}`,
            boxShadow: "0 14px 34px -26px rgba(26,25,22,0.5)",
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#8A857A", fontSize: 13 }}>Loading preview…</div>
          )}

          {boxes.map((box) => {
            const text = getBoxText(box, row);
            return (
              <div
                key={box.id}
                style={{
                  position: "absolute",
                  left: `${box.rect.x * 100}%`,
                  top: `${box.rect.y * 100}%`,
                  width: `${box.rect.width * 100}%`,
                  height: `${box.rect.height * 100}%`,
                  display: "flex",
                  alignItems:
                    box.style.verticalAlign === "bottom"
                      ? "flex-end"
                      : box.style.verticalAlign === "middle"
                        ? "center"
                        : "flex-start",
                  justifyContent:
                    box.style.align === "right"
                      ? "flex-end"
                      : box.style.align === "center"
                        ? "center"
                        : "flex-start",
                  overflow: "hidden",
                  padding: 2,
                  color: box.style.color,
                  fontFamily: cssFontFamily(box.style.fontFamily),
                  fontWeight: box.style.fontWeight === "bold" ? 700 : 400,
                  fontSize: "clamp(10px, 1.6vw, 24px)",
                  lineHeight: box.style.lineHeight,
                  textAlign: box.style.align,
                  outline: "1px dashed rgba(242,176,30,0.65)",
                  background: "rgba(255,255,255,0.24)",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: box.style.overflowMode === "wrap" ? "normal" : "nowrap" }}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CustomExportLayoutPreview({
  exportOptions,
  design,
  rowCount,
  freeRows,
  sheetLayoutInfo,
}: {
  exportOptions: ExportOptions;
  design: DesignAsset;
  rowCount: number;
  freeRows: number;
  sheetLayoutInfo: SheetLayoutInfo | null;
}) {
  const itemSize = resolveExportItemSizePoints({ exportOptions, designAsset: design });
  const ptToIn = (pt: number) => `${(pt / 72).toFixed(2)} in`;
  const isPrintSheets = exportOptions.layoutMode === "fitMultiplePerPage";

  if (!itemSize.ok) {
    return (
      <section style={{ background: "#fff", border: "1px solid #E7E2D6", borderRadius: 18, padding: 18 }}>
        <div style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#9A9486", textTransform: "uppercase", letterSpacing: "0.1em" }}>Final page preview</div>
        <p style={{ fontSize: 14, color: "#6E6A61", lineHeight: 1.5, margin: "10px 0 0" }}>
          Choose a finished size on the previous step to preview the export pages.
        </p>
      </section>
    );
  }

  const pageWidthPt = isPrintSheets && sheetLayoutInfo ? sheetLayoutInfo.pageWidthPt : itemSize.value.widthPt;
  const pageHeightPt = isPrintSheets && sheetLayoutInfo ? sheetLayoutInfo.pageHeightPt : itemSize.value.heightPt;
  const pageAspect = `${pageWidthPt} / ${pageHeightPt}`;
  const firstPageItems = isPrintSheets
    ? sheetLayoutInfo?.layout.pages[0]?.items.slice(0, 80) ?? []
    : [
        {
          rowIndex: 0,
          xPt: 0,
          yPt: 0,
          widthPt: itemSize.value.widthPt,
          heightPt: itemSize.value.heightPt,
        },
      ];
  const itemCountText = isPrintSheets && sheetLayoutInfo
    ? `${sheetLayoutInfo.layout.itemsPerPage} per page`
    : "1 per page";
  const pageCountText = isPrintSheets && sheetLayoutInfo
    ? `${sheetLayoutInfo.layout.pageCount} page${sheetLayoutInfo.layout.pageCount !== 1 ? "s" : ""}`
    : `${freeRows} PDF${freeRows !== 1 ? "s" : ""}`;

  return (
    <section style={{ background: "#fff", border: "1px solid #E7E2D6", borderRadius: 18, padding: 18, boxShadow: "0 20px 44px -34px rgba(26,25,22,0.28)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#9A9486", textTransform: "uppercase", letterSpacing: "0.1em" }}>Final page preview</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: "5px 0 4px", letterSpacing: "-0.01em" }}>
            {isPrintSheets ? "Multiple rows on each page" : "One row per PDF"}
          </h3>
          <p style={{ fontSize: 13.5, color: "#6E6A61", lineHeight: 1.5, margin: 0 }}>
            {isPrintSheets
              ? "The outlines show where each finished design will land on the first sheet."
              : "Each row becomes its own PDF using the finished size from the previous step."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#6E6A61", background: "#F4F1E9", borderRadius: 7, padding: "5px 8px" }}>{itemCountText}</span>
          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#6E6A61", background: "#F4F1E9", borderRadius: 7, padding: "5px 8px" }}>{pageCountText}</span>
        </div>
      </div>

      {isPrintSheets && !sheetLayoutInfo ? (
        <div style={{ background: "#FBEEEA", border: "1px solid #F2C9BD", borderRadius: 12, padding: 14, color: "#8A321F", fontSize: 13.5, lineHeight: 1.5 }}>
          This layout does not fit yet. Try a larger page, smaller margins, smaller gaps, or a smaller finished size.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 300px) 1fr", gap: 18, alignItems: "center" }} data-rcol>
          <div style={{ background: "#F4F1E9", border: "1px solid #EFEADF", borderRadius: 14, padding: 14 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 260,
                margin: "0 auto",
                aspectRatio: pageAspect,
                background: "#FFFFFF",
                border: "1.5px solid #DAD3C4",
                borderRadius: 8,
                boxShadow: "0 16px 30px -24px rgba(26,25,22,0.5)",
                overflow: "hidden",
              }}
            >
              {firstPageItems.map((item) => (
                <div
                  key={`${item.rowIndex}-${item.xPt}-${item.yPt}`}
                  style={{
                    position: "absolute",
                    left: `${(item.xPt / pageWidthPt) * 100}%`,
                    top: `${(item.yPt / pageHeightPt) * 100}%`,
                    width: `${(item.widthPt / pageWidthPt) * 100}%`,
                    height: `${(item.heightPt / pageHeightPt) * 100}%`,
                    border: "1.5px solid #F2B01E",
                    background: "rgba(242,176,30,0.12)",
                    borderRadius: 4,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8A6A12",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {item.rowIndex + 1}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 9 }}>
            {[
              ["Page", `${ptToIn(pageWidthPt)} x ${ptToIn(pageHeightPt)}`],
              ["Finished item", `${ptToIn(itemSize.value.widthPt)} x ${ptToIn(itemSize.value.heightPt)}`],
              ["Rows in CSV", String(rowCount)],
              ["Rows in this export", String(freeRows)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #F4F1E9", paddingBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#6E6A61" }}>{label}</span>
                <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: "#1A1916", textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BatchPdfClient() {
  const router = useRouter();

  const [session, setSession] = useState<SessionState>({
    step: "choose-design",
    workflowMode: null,
    csv: null,
    csvFileName: "",
    selectedTemplateId: null,
    mapping: {},
    previewRowIndex: 0,
    customDesign: createEmptyCustomDesignState(),
    customExportOptions: createDefaultExportOptions(),
    customPreflightResult: null,
  });
  const [starterExportStatus, setStarterExportStatus] = useState<ExportStatus>("idle");
  const [starterExportError, setStarterExportError] = useState<string | null>(null);
  const [customExportStatus, setCustomExportStatus] = useState<ExportStatus>("idle");
  const [customExportError, setCustomExportError] = useState<string | null>(null);
  const [showCustomSizeInputs, setShowCustomSizeInputs] = useState(false);

  // Load CSV from sessionStorage on mount; redirect if missing
  useEffect(() => {
    const stored = loadSessionCsv();
    if (!stored) {
      router.replace("/");
      return;
    }
    // Syncing the one-time sessionStorage handoff into local state on mount is a
    // legitimate external-store read; this is the intended use of an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession((s) => ({ ...s, csv: stored.asCsvResult(), csvFileName: stored.fileName }));
  }, [router]);

  // ── Computed ───────────────────────────────────────────────────────────────

  const selectedTemplate = getTemplateById(session.selectedTemplateId ?? "");
  const isStarterMode = session.workflowMode === "starterTemplate";
  const isCustomMode = session.workflowMode === "customDesign";
  const customDesignReady = isCustomDesignPreviewReady(session.customDesign);
  const allTemplates = getAllTemplates();
  const csvRowCount = session.csv?.rowCount ?? 0;
  const freeRows = Math.min(csvRowCount, BATCH_PDF_LIMITS.freeExportRows);

  const mappingValidation =
    isStarterMode && selectedTemplate && session.csv
      ? validateMapping(selectedTemplate, session.csv.headers, session.mapping)
      : null;
  const mappingErrors = mappingValidation && !mappingValidation.ok ? mappingValidation.errors : [];
  const missingValueWarnings =
    selectedTemplate && session.csv
      ? getMissingValueWarnings(session.csv.rows, session.mapping, selectedTemplate)
      : [];
  const isMappingValid = Boolean(mappingValidation?.ok);

  const isCustomFieldReady =
    isCustomMode && session.csv
      ? isCustomFieldPlacementReady({
          boxes: session.customDesign.fieldBoxes,
          csvHeaders: session.csv.headers,
        })
      : false;

  const preflightStatus = session.customPreflightResult?.status ?? null;
  const isImageDesign = session.customDesign.asset?.intrinsicUnit === "px";
  const isPrintSheets = session.customExportOptions.layoutMode === "fitMultiplePerPage";
  const imageHasValidSize =
    !isImageDesign ||
    (session.customExportOptions.itemSizeMode === "custom" &&
      typeof session.customExportOptions.customItemWidth === "number" &&
      session.customExportOptions.customItemWidth > 0 &&
      typeof session.customExportOptions.customItemHeight === "number" &&
      session.customExportOptions.customItemHeight > 0);

  // Resolve a print-sheet layout preview for the current options + design.
  const sheetLayoutInfo = useMemo<SheetLayoutInfo | null>(() => {
    const design = session.customDesign.asset;
    const opts = session.customExportOptions;
    if (!design || opts.layoutMode !== "fitMultiplePerPage") return null;

    const item = resolveExportItemSizePoints({ exportOptions: opts, designAsset: design });
    if (!item.ok) return null;

    const page = resolveSheetPageSizePoints({ exportOptions: opts, designAsset: design });
    if (!page.ok) return null;

    const layout = calculateSheetLayout({
      rowCount: freeRows,
      pageWidthPt: page.value.widthPt,
      pageHeightPt: page.value.heightPt,
      itemWidthPt: item.value.widthPt,
      itemHeightPt: item.value.heightPt,
      marginTopPt: measurementToPoints(opts.marginTop, opts.unit),
      marginRightPt: measurementToPoints(opts.marginRight, opts.unit),
      marginBottomPt: measurementToPoints(opts.marginBottom, opts.unit),
      marginLeftPt: measurementToPoints(opts.marginLeft, opts.unit),
      gapXPt: measurementToPoints(opts.gapX, opts.unit),
      gapYPt: measurementToPoints(opts.gapY, opts.unit),
    });
    if (!layout.ok) return null;

    return { layout: layout.value, pageWidthPt: page.value.widthPt, pageHeightPt: page.value.heightPt, itemWidthPt: item.value.widthPt, itemHeightPt: item.value.heightPt };
  }, [session.customDesign.asset, session.customExportOptions, freeRows]);

  const layoutCanCalculate = !isPrintSheets || sheetLayoutInfo !== null;

  const isCustomTextFitReady =
    Boolean(session.csv) &&
    Boolean(session.customDesign.asset) &&
    Boolean(session.customDesign.file) &&
    session.customDesign.fieldBoxes.length > 0 &&
    imageHasValidSize &&
    (preflightStatus === "ready" || preflightStatus === "readyWithWarnings");

  const isCustomExportReady =
    Boolean(session.csv) &&
    Boolean(session.customDesign.asset) &&
    Boolean(session.customDesign.file) &&
    session.customDesign.fieldBoxes.length > 0 &&
    imageHasValidSize &&
    layoutCanCalculate &&
    (preflightStatus === "ready" || preflightStatus === "readyWithWarnings");

  // ── Stepper ────────────────────────────────────────────────────────────────

  function goToStep(step: BatchPdfStep) {
    setSession((s) => ({ ...s, step }));
  }

  function buildSteps(): WizardStep[] {
    const stepOrder = isCustomMode ? CUSTOM_STEP_ORDER : STARTER_STEP_ORDER;
    const currentIdx = Math.max(0, stepOrder.indexOf(session.step));
    return [
      { n: 1, label: "Upload CSV", state: "complete", onClick: () => router.push("/") },
      ...stepOrder.map((stepKey, i) => ({
        n: i + 2,
        label: STEP_LABELS[stepKey],
        state: (i < currentIdx ? "complete" : i === currentIdx ? "current" : "locked") as WizardStep["state"],
        onClick: i < currentIdx ? () => goToStep(stepKey) : undefined,
      })),
    ];
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChooseWorkflow(mode: WorkflowMode) {
    setStarterExportStatus("idle");
    setStarterExportError(null);
    setCustomExportStatus("idle");
    setCustomExportError(null);
    setShowCustomSizeInputs(false);
    setSession((s) => ({
      ...s,
      step: "setup-design",
      workflowMode: mode,
      selectedTemplateId: mode === "starterTemplate" ? s.selectedTemplateId : null,
      mapping: mode === "starterTemplate" ? s.mapping : {},
      previewRowIndex: 0,
      customDesign: resetCustomDesignState(),
      customExportOptions: createDefaultExportOptions(),
      customPreflightResult: null,
    }));
  }

  function handleSelectTemplate(templateId: string) {
    const template = getTemplateById(templateId);
    if (!template || !session.csv) return;
    setSession((s) => ({
      ...s,
      selectedTemplateId: templateId,
      mapping: autoMapFields(template, s.csv?.headers ?? []),
    }));
  }

  function handleContinueFromSetupDesign() {
    setSession((s) => ({ ...s, step: "mapping" }));
  }

  function handleMappingChange(fieldKey: string, csvHeader: string) {
    setSession((s) => {
      const next = { ...s.mapping };
      if (csvHeader === "") delete next[fieldKey];
      else next[fieldKey] = csvHeader;
      return { ...s, mapping: next };
    });
  }

  function handleContinueToPreview() {
    setSession((s) => ({
      ...s,
      step: "preview",
      previewRowIndex: clampPreviewRowIndex(s.previewRowIndex, s.csv?.rows.length ?? 0),
    }));
  }

  function handlePreviousRow() {
    setSession((s) => ({
      ...s,
      previewRowIndex: clampPreviewRowIndex(s.previewRowIndex - 1, s.csv?.rows.length ?? 0),
    }));
  }

  function handleNextRow() {
    setSession((s) => ({
      ...s,
      previewRowIndex: clampPreviewRowIndex(s.previewRowIndex + 1, s.csv?.rows.length ?? 0),
    }));
  }

  function handleContinueToExport() {
    setSession((s) => ({
      ...s,
      step: s.workflowMode === "customDesign" ? "export-options" : "export",
    }));
  }

  function handleContinueToFinalExport() {
    setSession((s) => ({ ...s, step: "export" }));
  }

  const handleCustomDesignAcceptedFile = useCallback((file: File) => {
    setCustomExportStatus("idle");
    setCustomExportError(null);
    setShowCustomSizeInputs(false);
    setSession((s) => {
      if (s.customDesign.previewUrl) URL.revokeObjectURL(s.customDesign.previewUrl);
      return {
        ...s,
        customDesign: { ...resetCustomDesignState(), file, previewStatus: "loading" },
        customExportOptions: createDefaultExportOptions(),
        customPreflightResult: null,
      };
    });
  }, []);

  const handleCustomDesignRejectedFile = useCallback((errors: BatchPdfError[]) => {
    setCustomExportStatus("idle");
    setCustomExportError(null);
    setShowCustomSizeInputs(false);
    setSession((s) => {
      if (s.customDesign.previewUrl) URL.revokeObjectURL(s.customDesign.previewUrl);
      return {
        ...s,
        customDesign: { ...resetCustomDesignState(), previewStatus: "error", errors },
        customExportOptions: createDefaultExportOptions(),
        customPreflightResult: null,
      };
    });
  }, []);

  const handleCustomDesignReset = useCallback(() => {
    setCustomExportStatus("idle");
    setCustomExportError(null);
    setShowCustomSizeInputs(false);
    setSession((s) => {
      if (s.customDesign.previewUrl) URL.revokeObjectURL(s.customDesign.previewUrl);
      return {
        ...s,
        customDesign: resetCustomDesignState(),
        customExportOptions: createDefaultExportOptions(),
        customPreflightResult: null,
      };
    });
  }, []);

  const handleCustomDesignAssetReady = useCallback((asset: DesignAsset) => {
    setSession((s) => {
      // Image designs use pixels, so "same as design" cannot resolve to physical
      // points — choose a friendly best-guess print size when the shape is clear.
      const needsCustomItemSize = asset.intrinsicUnit === "px";
      const recommendedSize = getRecommendedFinishedSize(asset);
      return {
        ...s,
        customDesign: { ...s.customDesign, asset, errors: [] },
        customExportOptions: needsCustomItemSize
          ? { ...s.customExportOptions, itemSizeMode: "custom", ...recommendedSize }
          : s.customExportOptions,
      };
    });
  }, []);

  const handleCustomDesignPreviewUrlChange = useCallback((previewUrl: string | null) => {
    setSession((s) => ({ ...s, customDesign: { ...s.customDesign, previewUrl } }));
  }, []);

  const handleCustomDesignPreviewStatusChange = useCallback(
    (previewStatus: CustomDesignPreviewStatus) => {
      setSession((s) => ({ ...s, customDesign: { ...s.customDesign, previewStatus } }));
    },
    [],
  );

  const handleCustomDesignErrorsChange = useCallback((errors: BatchPdfError[]) => {
    setSession((s) => ({ ...s, customDesign: { ...s.customDesign, errors } }));
  }, []);

  const handleCustomFieldBoxesChange = useCallback((fieldBoxes: CustomFieldBox[]) => {
    setSession((s) => ({
      ...s,
      customDesign: {
        ...s.customDesign,
        fieldBoxes,
        selectedFieldBoxId: fieldBoxes.some((b) => b.id === s.customDesign.selectedFieldBoxId)
          ? s.customDesign.selectedFieldBoxId
          : (fieldBoxes[0]?.id ?? null),
      },
    }));
  }, []);

  const handleSelectedFieldBoxChange = useCallback((selectedFieldBoxId: string | null) => {
    setSession((s) => ({ ...s, customDesign: { ...s.customDesign, selectedFieldBoxId } }));
  }, []);

  const handleCustomExportOptionsChange = useCallback((options: ExportOptions) => {
    setCustomExportStatus("idle");
    setCustomExportError(null);
    setSession((s) => ({ ...s, customExportOptions: options }));
  }, []);

  const handleFinishedSizePresetChange = useCallback((preset: FinishedSizePreset) => {
    setShowCustomSizeInputs(preset.id === "custom");

    if (preset.id === "custom") {
      setSession((s) => ({
        ...s,
        customExportOptions: {
          ...s.customExportOptions,
          itemSizeMode: "custom",
          unit: "in",
          customItemWidth:
            s.customExportOptions.customItemWidth ??
            (s.customDesign.asset ? getRecommendedFinishedSize(s.customDesign.asset).customItemWidth : undefined),
          customItemHeight:
            s.customExportOptions.customItemHeight ??
            (s.customDesign.asset ? getRecommendedFinishedSize(s.customDesign.asset).customItemHeight : undefined),
        },
      }));
      return;
    }

    setSession((s) => ({
      ...s,
      customExportOptions: {
        ...s.customExportOptions,
        itemSizeMode: "custom",
        customItemWidth: preset.width,
        customItemHeight: preset.height,
        unit: "in",
      },
    }));
  }, []);

  const handleCustomPreflightResultChange = useCallback(
    (result: CustomDesignPreflightResult | null) => {
      setSession((s) => ({ ...s, customPreflightResult: result }));
    },
    [],
  );

  async function handleStarterExport() {
    if (!session.csv || !session.selectedTemplateId) return;
    const exportStartedAt = Date.now();
    setStarterExportStatus("loading");
    setStarterExportError(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: session.selectedTemplateId,
          rows: session.csv.rows,
          mapping: session.mapping,
          mode: "free",
        }),
      });
      if (!res.ok) {
        await waitForMinimumExportLoading(exportStartedAt);
        setStarterExportStatus("error");
        setStarterExportError("Export failed. Check your mapping and try again.");
        return;
      }
      const blob = await res.blob();
      await waitForMinimumExportLoading(exportStartedAt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "batch-pdf-free-export.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStarterExportStatus("success");
    } catch {
      await waitForMinimumExportLoading(exportStartedAt);
      setStarterExportStatus("error");
      setStarterExportError("Could not reach the export service. Check your connection.");
    }
  }

  async function handleCustomExport() {
    const { customDesign, csv, customExportOptions } = session;
    if (!csv || !customDesign.asset || !customDesign.file) return;
    const exportStartedAt = Date.now();
    setCustomExportStatus("loading");
    setCustomExportError(null);
    try {
      const payload = {
        mode: "free" as const,
        rows: csv.rows,
        csvHeaders: csv.headers,
        designAsset: customDesign.asset,
        fieldBoxes: customDesign.fieldBoxes,
        exportOptions: customExportOptions,
      };
      const formData = new FormData();
      formData.append("designFile", customDesign.file);
      formData.append("payload", JSON.stringify(payload));
      const res = await fetch("/api/generate-custom-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        let msg = "Export failed. Fix any highlighted issues and try again.";
        try {
          const body = await res.json();
          if (typeof body?.error === "string") msg = body.error;
        } catch { /* ignore */ }
        await waitForMinimumExportLoading(exportStartedAt);
        setCustomExportError(msg);
        setCustomExportStatus("error");
        return;
      }
      const blob = await res.blob();
      await waitForMinimumExportLoading(exportStartedAt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "batch-pdf-custom-export.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setCustomExportStatus("success");
    } catch {
      await waitForMinimumExportLoading(exportStartedAt);
      setCustomExportStatus("error");
      setCustomExportError("Something went wrong. Check your connection and try again.");
    }
  }

  // ── Step renders ───────────────────────────────────────────────────────────

  const renderChooseDesign = () => (
    <div>
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 30px" }}>
        <div style={STEP_LABEL_STYLE}>Step 2 · Choose design</div>
        <h2 style={{ ...H2, fontSize: 34 }}>How do you want to design it?</h2>
        <p style={{ fontSize: 16, color: "#57534A", lineHeight: 1.5 }}>
          Both paths end the same way — a ZIP of personalized PDFs from your{" "}
          <strong style={{ color: "#1A1916" }}>{csvRowCount} rows</strong>. Pick the one that
          fits what you have.
        </p>
        <HelpfulTip style={{ marginTop: 16, textAlign: "left" }}>
          If you need something quickly, start with a template. If you already have artwork from Canva, a school brand kit, or an event flyer, upload your own design.
        </HelpfulTip>
      </div>

      <div
        data-rcol
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 880, margin: "0 auto" }}
      >
        {/* Starter template */}
        <div
          className="vs-choice-card"
          onClick={() => handleChooseWorkflow("starterTemplate")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleChooseWorkflow("starterTemplate")}
          style={{ background: "#FFFFFF", border: "1.5px solid #E7E2D6", borderRadius: 20, padding: 26, cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .15s" }}
        >
          <div style={{ height: 128, borderRadius: 14, background: "#FCFBF7", border: "1px solid #EFEADF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 74, height: 96, background: "#fff", border: "1px solid #E7E2D6", borderTop: "3px solid #F2B01E", borderRadius: 6, boxShadow: "0 8px 18px -10px rgba(0,0,0,0.25)", padding: "12px 9px", textAlign: "center" }}>
                <div style={{ ...MONO, fontSize: 4.5, letterSpacing: "0.15em", color: "#A39B8A" }}>CERTIFICATE</div>
                <div style={{ fontSize: 11, marginTop: 12 }}>Name</div>
                <div style={{ height: 2, width: 36, background: "#EFEADF", margin: "8px auto 0" }} />
                <div style={{ height: 2, width: 26, background: "#EFEADF", margin: "5px auto 0" }} />
              </div>
              <div style={{ width: 54, height: 96, background: "#1A1916", borderRadius: 6, boxShadow: "0 8px 18px -10px rgba(0,0,0,0.4)", padding: "10px 7px", textAlign: "center" }}>
                <div style={{ height: 3, width: 24, background: "#F2B01E", borderRadius: 2, margin: "0 auto 12px" }} />
                <div style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>L. Chen</div>
                <div style={{ color: "#B7B1A4", fontSize: 6, marginTop: 3 }}>SPEAKER</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#8A6A12", background: "#FBEFCB", padding: "3px 8px", borderRadius: 6 }}>A</span>
            <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>Use a starter template</h3>
          </div>
          <p style={{ fontSize: 14, color: "#6E6A61", lineHeight: 1.5, margin: "10px 0 16px" }}>
            Choose from built-in certificates, badges, labels, and cards. Fastest if you don&apos;t have your own design.
          </p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#1A1916" }}>
            Browse templates <span>→</span>
          </span>
        </div>

        {/* Custom design */}
        <div
          className="vs-choice-card"
          onClick={() => handleChooseWorkflow("customDesign")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleChooseWorkflow("customDesign")}
          style={{ background: "#FFFFFF", border: "1.5px solid #E7E2D6", borderRadius: 20, padding: 26, cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .15s" }}
        >
          <div style={{ height: 128, borderRadius: 14, background: "#FCFBF7", border: "1px solid #EFEADF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <div style={{ width: 130, height: 90, background: "#fff", border: "1px solid #E7E2D6", borderRadius: 7, boxShadow: "0 8px 18px -10px rgba(0,0,0,0.22)", position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: 18, width: 62, height: 16, border: "1.5px dashed #F2B01E", borderRadius: 4 }} />
              <div style={{ position: "absolute", left: 14, top: 42, width: 42, height: 11, border: "1.5px dashed #C9C1B0", borderRadius: 4 }} />
              <div style={{ position: "absolute", right: 12, bottom: 12, width: 34, height: 34, background: "#FBEFCB", borderRadius: 5 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#8A6A12", background: "#FBEFCB", padding: "3px 8px", borderRadius: 6 }}>B</span>
            <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>Upload my own design</h3>
          </div>
          <p style={{ fontSize: 14, color: "#6E6A61", lineHeight: 1.5, margin: "10px 0 16px" }}>
            Use your own PNG or JPEG image and place CSV fields on top of it exactly where you want them.
          </p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#1A1916" }}>
            Upload a design <span>→</span>
          </span>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button type="button" onClick={() => router.push("/")} style={{ background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
          ← Back to CSV upload
        </button>
      </div>
    </div>
  );

  const renderStep3a = () => {
    const reqCount = selectedTemplate ? selectedTemplate.fields.filter((f) => f.required).length : 0;
    return (
      <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 34, alignItems: "start" }}>
        <div>
          <div style={STEP_LABEL_STYLE}>Step 3 · Set up design</div>
          <h2 style={H2}>Pick a starter template</h2>
          <p style={SUBTEXT}>Each template already has its fields laid out. You&apos;ll connect them to your CSV columns next.</p>
          <HelpfulTip style={{ marginBottom: 16 }}>
            Pick the closest template, not the perfect one. You will preview real rows before anything is generated.
          </HelpfulTip>
          <div data-rcol4 style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {allTemplates.map((t) => {
              const sel = t.id === session.selectedTemplateId;
              return (
                <div
                  key={t.id}
                  className="vs-tpl-card"
                  onClick={() => handleSelectTemplate(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectTemplate(t.id)}
                  style={{ background: "#FFFFFF", border: `1.5px solid ${sel ? "#F2B01E" : "#E7E2D6"}`, borderRadius: 16, padding: 18, cursor: "pointer", transition: "border-color .15s, box-shadow .15s", boxShadow: sel ? "0 8px 20px -10px rgba(242,176,30,0.3)" : "none" }}
                >
                  <div style={{ height: 120, borderRadius: 12, background: "#FCFBF7", border: "1px solid #EFEADF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    {templateThumb(t.id)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: 16.5, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>{t.name}</h3>
                    {sel && (
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: "#F2B01E", color: "#1A1916", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>✓</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#8A857A", margin: "5px 0 12px" }}>{t.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {t.recommendedFor.slice(0, 3).map((tag) => (
                      <span key={tag} style={{ ...MONO, fontSize: 10.5, fontWeight: 600, color: "#6E6A61", background: "#F4F1E9", padding: "3px 7px", borderRadius: 6 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside data-raside style={{ position: "sticky", top: 130, background: "#FFFFFF", border: "1px solid #E7E2D6", borderRadius: 18, padding: 20 }}>
          <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#9A9486", textTransform: "uppercase" }}>Selected</div>
          <div style={{ fontSize: 18, fontWeight: 800, margin: "7px 0 3px" }}>{selectedTemplate?.name ?? "—"}</div>
          <div style={{ fontSize: 13, color: "#8A857A" }}>{selectedTemplate?.description ?? "Choose a template from the left"}</div>
          <div style={{ height: 1, background: "#F0EDE4", margin: "16px 0" }} />
          {selectedTemplate ? (
            <div style={{ fontSize: 13, color: "#6E6A61", lineHeight: 1.5 }}>
              This template needs <strong style={{ color: "#1A1916" }}>{reqCount} required</strong> field{reqCount !== 1 ? "s" : ""}. We&apos;ll auto-connect any CSV columns that match.
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#9A9486", lineHeight: 1.5 }}>Select a template to see its details and continue.</div>
          )}
          <HelpfulTip style={{ marginTop: 14 }}>
            Short names like Name, Award, Date, and Role make the next step easier to check.
          </HelpfulTip>
          <button
            type="button"
            disabled={!selectedTemplate}
            onClick={handleContinueFromSetupDesign}
            style={{ width: "100%", marginTop: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: selectedTemplate ? "#1A1916" : "#E7E2D6", color: selectedTemplate ? "#fff" : "#9A9486", fontWeight: 700, fontSize: 14.5, padding: "13px 18px", border: "none", borderRadius: 11, cursor: selectedTemplate ? "pointer" : "not-allowed" }}
          >
            Continue — map fields →
          </button>
          <button type="button" onClick={() => goToStep("choose-design")} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            ← Choose a different source
          </button>
        </aside>
      </div>
    );
  };

  const renderStep3b = () => {
    const { customDesign } = session;
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <div style={STEP_LABEL_STYLE}>Step 3 · Upload design</div>
          <h2 style={H2}>Upload your design</h2>
          <p style={{ ...SUBTEXT, maxWidth: 520, margin: "0 auto 24px" }}>
            Upload a PNG or JPEG image. You&apos;ll place your CSV fields on top of it in the next step.
          </p>
          <HelpfulTip style={{ maxWidth: 560, margin: "0 auto 20px", textAlign: "left" }}>
            Designs work best when they already have clear blank spaces for names, dates, roles, or table numbers.
          </HelpfulTip>
        </div>

        <div style={{ display: customDesignReady ? "none" : "block" }}>
          <CustomDesignUpload
            state={customDesign}
            onAcceptedFile={handleCustomDesignAcceptedFile}
            onRejectedFile={handleCustomDesignRejectedFile}
            onReset={handleCustomDesignReset}
          />
        </div>

        <div style={{ display: customDesignReady ? "none" : "block" }}>
          {customDesign.file && (
            <CustomDesignPreview
              file={customDesign.file}
              previewUrl={customDesign.previewUrl}
              previewStatus={customDesign.previewStatus}
              onAssetReady={handleCustomDesignAssetReady}
              onPreviewUrlChange={handleCustomDesignPreviewUrlChange}
              onStatusChange={handleCustomDesignPreviewStatusChange}
              onErrorsChange={handleCustomDesignErrorsChange}
              hideWhenReady={false}
            />
          )}
        </div>

        {customDesignReady && customDesign.asset && (
          <div style={{ marginTop: 16 }}>
            <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 20, background: "#fff", border: "1px solid #E7E2D6", borderRadius: 18, padding: 18, alignItems: "center" }}>
              <div style={{ background: "#FCFBF7", border: "1px solid #EFEADF", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
                {customDesign.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customDesign.previewUrl} alt="Design preview" style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 6, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.2)" }} />
                ) : (
                  <div style={{ color: "#9A9486", fontSize: 13 }}>No preview available</div>
                )}
              </div>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#2E8B57", background: "#EEF8F1", border: "1px solid #CDEBD9", padding: "5px 10px", borderRadius: 8 }}>
                  ✓ Ready to place fields
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, margin: "14px 0 12px", wordBreak: "break-word" }}>{customDesign.asset.fileName}</div>
                {([
                  ["Type", customDesign.asset.kind.toUpperCase()],
                  ["Dimensions", `${Math.round(customDesign.asset.intrinsicWidth)} × ${Math.round(customDesign.asset.intrinsicHeight)} ${customDesign.asset.intrinsicUnit}`],
                  ["Size", formatBytes(customDesign.asset.sizeBytes)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F4F1E9", fontSize: 12.5 }}>
                    <span style={{ color: "#8A857A" }}>{k}</span>
                    <span style={{ ...MONO, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                <HelpfulTip style={{ marginTop: 14 }}>
                  This preview is scaled down to fit the page. The exported PDFs will use your original uploaded image.
                </HelpfulTip>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="button" onClick={handleContinueFromSetupDesign} style={{ flex: 1, background: "#1A1916", color: "#fff", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: "pointer" }}>
                Place fields →
              </button>
              <button type="button" onClick={handleCustomDesignReset} style={{ flexShrink: 0, background: "#fff", color: "#1A1916", fontWeight: 700, fontSize: 15, padding: "14px 20px", border: "1.5px solid #DAD3C4", borderRadius: 11, cursor: "pointer" }}>
                Replace design
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" onClick={() => goToStep("choose-design")} style={{ background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            ← Choose a different source
          </button>
        </div>
      </div>
    );
  };

  const renderStep4a = () => {
    if (!selectedTemplate || !session.csv) return null;
    const sampleRow = session.csv.rows[0] ?? {};

    return (
      <div>
        <div style={STEP_LABEL_STYLE}>Step 4 · Map fields</div>
        <h2 style={H2}>Connect template fields to your columns</h2>
        <p style={{ ...SUBTEXT, maxWidth: 620 }}>
          We already matched the ones we recognized. Required fields must be connected before you can preview.
        </p>
        <HelpfulTip style={{ maxWidth: 680, marginBottom: 16 }}>
          Match by meaning, not exact spelling. A template field called Recipient can use a spreadsheet column called Student Name.
        </HelpfulTip>

        <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E7E2D6", borderRadius: 18, padding: "8px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 18px 1fr", gap: 6, padding: "12px 16px 8px", ...MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", color: "#9A9486", textTransform: "uppercase" }}>
              <span>Template field</span><span /><span>Your CSV column</span>
            </div>
            {selectedTemplate.fields.map((field, i) => {
              const hasErr = mappingErrors.some((e) => e.fieldKey === field.key);
              const hasWarn = missingValueWarnings.some((w) => w.fieldKey === field.key);
              const warnMsg = missingValueWarnings.find((w) => w.fieldKey === field.key)?.message;
              const errMsg = mappingErrors.find((e) => e.fieldKey === field.key)?.message;
              return (
                <div key={field.key} style={{ display: "grid", gridTemplateColumns: "1fr 18px 1fr", gap: 6, padding: "14px 16px", borderBottom: i < selectedTemplate.fields.length - 1 ? "1px solid #F4F1E9" : "none", alignItems: "start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700 }}>{field.label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: field.required ? "#FBEEEA" : "#F4F1E9", color: field.required ? "#B5482E" : "#8A857A" }}>
                        {field.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <div style={{ ...MONO, fontSize: 11, color: "#9A9486", marginTop: 3 }}>{field.aliases.slice(0, 3).join(", ")}</div>
                    {hasWarn && warnMsg && <div style={{ fontSize: 11.5, color: "#8A6A12", marginTop: 4, background: "#FBEFCB", padding: "3px 7px", borderRadius: 6, display: "inline-block" }}>{warnMsg}</div>}
                    {hasErr && errMsg && <div style={{ fontSize: 11.5, color: "#B5482E", marginTop: 4 }}>{errMsg}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#CFC8B8", paddingTop: 6 }}>→</div>
                  <div>
                    <select
                      value={session.mapping[field.key] ?? ""}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      style={{ width: "100%", padding: "9px 10px", border: `1px solid ${hasErr ? "#F2C9BD" : "#DAD3C4"}`, borderRadius: 9, fontSize: 13.5, fontWeight: 600, background: "#fff", color: "#1A1916" }}
                    >
                      <option value="">— not mapped —</option>
                      {session.csv?.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <aside data-raside style={{ position: "sticky", top: 130 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E7E2D6", borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <div style={{ ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#9A9486", textTransform: "uppercase", marginBottom: 10 }}>Sample row · row 1</div>
              {session.csv.headers.map((col) => (
                <div key={col} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: "1px solid #F4F1E9", fontSize: 12.5 }}>
                  <span style={{ ...MONO, color: "#8A6A12", flexShrink: 0 }}>{col}</span>
                  <span style={{ fontWeight: 600, color: "#1A1916", textAlign: "right", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sampleRow[col] ?? "—"}</span>
                </div>
              ))}
            </div>
            <HelpfulTip style={{ marginBottom: 12 }}>
              This sample row is only for checking. All rows in your CSV will use the same mapping.
            </HelpfulTip>
            <div style={{ background: isMappingValid ? "#EEF8F1" : "#FBEFCB", border: `1px solid ${isMappingValid ? "#CDEBD9" : "#F0DFA8"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: isMappingValid ? "#2E8B57" : "#8A6A12" }}>
                {isMappingValid ? "✓ All required fields mapped" : "Map all required fields"}
              </div>
            </div>
            <button type="button" disabled={!isMappingValid} onClick={handleContinueToPreview} style={{ width: "100%", background: isMappingValid ? "#1A1916" : "#E7E2D6", color: isMappingValid ? "#fff" : "#9A9486", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: isMappingValid ? "pointer" : "not-allowed" }}>
              Preview PDFs →
            </button>
            <button type="button" onClick={() => goToStep("setup-design")} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ← Back to templates
            </button>
          </aside>
        </div>
      </div>
    );
  };

  const renderStep4b = () => {
    const { customDesign } = session;
    if (!customDesign.asset || !customDesign.file || !session.csv) return null;

    return (
      <div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <div style={STEP_LABEL_STYLE}>Step 4 · Place fields</div>
            <h2 style={{ ...H2, fontSize: 26, margin: "6px 0 3px" }}>Put your spreadsheet text on the design</h2>
            <p style={{ fontSize: 14, color: "#57534A", margin: 0, maxWidth: 620 }}>Choose a column, add it to the design, then drag the box onto the right blank space.</p>
          </div>
        </div>
        <HelpfulTip style={{ marginBottom: 14, maxWidth: 760 }}>
          Start with the most important field, usually the name. Make its box a little wider than the sample text so longer names still fit.
        </HelpfulTip>

        <CustomFieldPlacementEditor
          file={customDesign.file}
          asset={customDesign.asset}
          previewUrl={customDesign.previewUrl}
          csvHeaders={session.csv.headers}
          boxes={customDesign.fieldBoxes}
          selectedBoxId={customDesign.selectedFieldBoxId}
          onBoxesChange={handleCustomFieldBoxesChange}
          onSelectedBoxChange={handleSelectedFieldBoxChange}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button type="button" disabled={!isCustomFieldReady} onClick={handleContinueToPreview} style={{ flex: 1, background: isCustomFieldReady ? "#1A1916" : "#E7E2D6", color: isCustomFieldReady ? "#fff" : "#9A9486", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: isCustomFieldReady ? "pointer" : "not-allowed" }}>
            Check & confirm →
          </button>
          <button type="button" onClick={() => goToStep("setup-design")} style={{ flexShrink: 0, background: "#fff", color: "#1A1916", fontWeight: 700, fontSize: 15, padding: "14px 20px", border: "1.5px solid #DAD3C4", borderRadius: 11, cursor: "pointer" }}>
            ← Back to upload
          </button>
        </div>
      </div>
    );
  };

  const renderStep5a = () => {
    if (!selectedTemplate || !session.csv) return null;
    const row = session.csv.rows[session.previewRowIndex] ?? {};
    const mappedData = mapRowToTemplateData(row, session.mapping, selectedTemplate);
    const pvPairs = selectedTemplate.fields.map((f) => ({ label: f.label, val: mappedData[f.key] || "—", empty: !mappedData[f.key] }));

    return (
      <div>
        <div style={STEP_LABEL_STYLE}>Step 5 · Preview</div>
        <h2 style={H2}>Check a few rows before you export</h2>
        <p style={{ ...SUBTEXT, maxWidth: 620 }}>This is exactly how each PDF will look. Step through rows to spot anything that doesn&apos;t fit.</p>
        <HelpfulTip style={{ maxWidth: 680, marginBottom: 16 }}>
          Check the shortest and longest names you can find. Those two rows usually reveal most spacing problems.
        </HelpfulTip>

        <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E7E2D6", borderRadius: 20, padding: 24, boxShadow: "0 24px 50px -32px rgba(26,25,22,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1916" }}>PDF preview</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" onClick={handlePreviousRow} style={{ width: 30, height: 30, border: "1px solid #E7E2D6", background: "#fff", borderRadius: 8, fontSize: 14, color: "#4A463E", cursor: "pointer" }}>‹</button>
                <span style={{ ...MONO, fontSize: 12, color: "#6E6A61", minWidth: 84, textAlign: "center" }}>row {session.previewRowIndex + 1} / {csvRowCount}</span>
                <button type="button" onClick={handleNextRow} style={{ width: 30, height: 30, border: "1px solid #E7E2D6", background: "#fff", borderRadius: 8, fontSize: 14, color: "#4A463E", cursor: "pointer" }}>›</button>
              </div>
            </div>
            <TemplatePreviewRenderer template={selectedTemplate} data={mappedData} />
          </div>

          <aside data-raside style={{ position: "sticky", top: 130 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E7E2D6", borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <div style={{ ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#9A9486", textTransform: "uppercase", marginBottom: 10 }}>Values in this row</div>
              {pvPairs.map((p) => (
                <div key={p.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: "1px solid #F4F1E9", fontSize: 12.5 }}>
                  <span style={{ color: "#8A857A" }}>{p.label}</span>
                  <span style={{ fontWeight: 600, color: p.empty ? "#C9C1B0" : "#1A1916", textAlign: "right", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.val}</span>
                </div>
              ))}
            </div>
            {missingValueWarnings.length > 0 && (
              <div style={{ background: "#FBEFCB", border: "1px solid #F0DFA8", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#8A6A12", marginBottom: 12 }}>
                Some cells are empty — check warnings in the mapping step.
              </div>
            )}
            <HelpfulTip style={{ marginBottom: 12 }}>
              Empty values are okay if they are intentional. Go back to mapping if something important is missing.
            </HelpfulTip>
            <button type="button" onClick={handleContinueToExport} style={{ width: "100%", background: "#1A1916", color: "#fff", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: "pointer" }}>
              Generate free ZIP →
            </button>
            <button type="button" onClick={() => goToStep("mapping")} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ← Back to mapping
            </button>
          </aside>
        </div>
      </div>
    );
  };

  const renderStep5b = () => {
    const { customDesign, csv } = session;
    if (!customDesign.asset || !customDesign.file || !csv) return null;

    const canContinue = isCustomTextFitReady;
    const hasWarnings = preflightStatus === "readyWithWarnings";
    const selectedSizePresetId = getFinishedSizePresetId(session.customExportOptions);
    const customSizeSelected = showCustomSizeInputs || selectedSizePresetId === "custom";
    const recommendedSizePresetId = getFinishedSizePresetId({
      ...session.customExportOptions,
      itemSizeMode: "custom",
      ...getRecommendedFinishedSize(customDesign.asset),
    });
    const previewRow = csv.rows[session.previewRowIndex] ?? csv.rows[0] ?? {};

    let sBg = "#F4F1E9", sBorder = "#E7E2D6", sIcon = "…", sTitle = "Checking…", sBody = "Checking whether the text fits inside your boxes.";
    if (canContinue && hasWarnings) { sBg = "#FBEFCB"; sBorder = "#F0DFA8"; sIcon = "!"; sTitle = "Looks okay"; sBody = "Some text may be adjusted, but you can still continue."; }
    else if (canContinue) { sBg = "#EEF8F1"; sBorder = "#CDEBD9"; sIcon = "✓"; sTitle = "Looks good"; sBody = "The text fits and the finished size is set."; }
    else if (preflightStatus === "blocked") { sBg = "#FBEEEA"; sBorder = "#F2C9BD"; sIcon = "×"; sTitle = "Fix before export"; sBody = "Some text does not fit yet. Make the field box bigger or adjust the text style."; }
    else if (preflightStatus === "needsOutputSize") { sIcon = "↕"; sTitle = "Choose a finished size"; sBody = "Pick how big each finished PDF should be."; }

    return (
      <div>
        <div style={STEP_LABEL_STYLE}>Step 5 · Preview</div>
        <h2 style={H2}>Does this look right?</h2>
        <p style={{ ...SUBTEXT, maxWidth: 680 }}>Check a row and confirm the finished size so we can catch text that may not fit.</p>
        <HelpfulTip style={{ maxWidth: 720, marginBottom: 16 }}>
          The size here is the final printed size, not the image pixel size. Certificates are usually 11 x 8.5 inches; badges and cards are usually smaller.
        </HelpfulTip>

        <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <CustomDesignReviewPreview
              file={customDesign.file}
              asset={customDesign.asset}
              boxes={customDesign.fieldBoxes}
              row={previewRow}
              rowIndex={session.previewRowIndex}
              rowCount={csv.rows.length}
              onPrevious={handlePreviousRow}
              onNext={handleNextRow}
            />

            <section style={{ background: "#fff", border: "1px solid #E7E2D6", borderRadius: 18, padding: 18 }}>
              <div style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#9A9486", textTransform: "uppercase", letterSpacing: "0.1em" }}>Finished size</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "5px 0 6px", letterSpacing: "-0.01em" }}>How big should each finished PDF be?</h3>
              <p style={{ fontSize: 13.5, color: "#6E6A61", lineHeight: 1.5, margin: "0 0 14px" }}>
                This sets the real print size. The certificate template is usually letter size.
              </p>
              <HelpfulTip style={{ marginBottom: 14 }}>
                If you are unsure, choose the size of the paper or card you plan to hand out.
              </HelpfulTip>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                {FINISHED_SIZE_PRESETS.map((preset) => {
                  const selected = preset.id === "custom"
                    ? customSizeSelected
                    : !customSizeSelected && selectedSizePresetId === preset.id;
                  const recommended = preset.id === recommendedSizePresetId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleFinishedSizePresetChange(preset)}
                      style={{
                        textAlign: "left",
                        border: `1.5px solid ${selected ? "#F2B01E" : "#E7E2D6"}`,
                        background: selected ? "#FFFAEB" : "#FFFFFF",
                        borderRadius: 12,
                        padding: 13,
                        cursor: "pointer",
                        boxShadow: selected ? "0 8px 18px -14px rgba(242,176,30,0.7)" : "none",
                      }}
                    >
                      <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#1A1916" }}>{preset.label}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: "#6E6A61", marginTop: 4 }}>{preset.hint}</span>
                      {recommended ? (
                        <span style={{ display: "inline-block", marginTop: 8, ...MONO, fontSize: 10, fontWeight: 700, color: "#8A6A12", background: "#FBEFCB", borderRadius: 5, padding: "3px 6px" }}>
                          Recommended
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {customSizeSelected ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 700, color: "#6E6A61" }}>
                    Width (in)
                    <input
                      type="number"
                      min={0.5}
                      step={0.125}
                      value={session.customExportOptions.customItemWidth ?? ""}
                      onChange={(event) =>
                        handleCustomExportOptionsChange({
                          ...session.customExportOptions,
                          itemSizeMode: "custom",
                          unit: "in",
                          customItemWidth: event.target.value ? Number.parseFloat(event.target.value) : undefined,
                        })
                      }
                      style={{ border: "1px solid #DAD3C4", borderRadius: 9, padding: "10px 11px", fontSize: 14 }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 700, color: "#6E6A61" }}>
                    Height (in)
                    <input
                      type="number"
                      min={0.5}
                      step={0.125}
                      value={session.customExportOptions.customItemHeight ?? ""}
                      onChange={(event) =>
                        handleCustomExportOptionsChange({
                          ...session.customExportOptions,
                          itemSizeMode: "custom",
                          unit: "in",
                          customItemHeight: event.target.value ? Number.parseFloat(event.target.value) : undefined,
                        })
                      }
                      style={{ border: "1px solid #DAD3C4", borderRadius: 9, padding: "10px 11px", fontSize: 14 }}
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <CustomPreflightPanel
              key={`${customDesign.asset.fileName}-${customDesign.asset.sizeBytes}`}
              design={customDesign.asset}
              rows={csv.rows}
              csvHeaders={csv.headers}
              fieldBoxes={customDesign.fieldBoxes}
              exportOptions={session.customExportOptions}
              onPreflightResultChange={handleCustomPreflightResultChange}
            />
          </div>

          <aside data-raside style={{ position: "sticky", top: 130 }}>
            <div style={{ background: sBg, border: `1px solid ${sBorder}`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "#fff", border: `1px solid ${sBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{sIcon}</span>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{sTitle}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "12px 0 0", color: "#4A463E" }}>{sBody}</p>
            </div>
            <HelpfulTip style={{ marginBottom: 12 }}>
              Use the row arrows to test a few real people before continuing.
            </HelpfulTip>
            <button
              type="button"
              disabled={!canContinue}
              onClick={handleContinueToExport}
              style={{ width: "100%", background: canContinue ? (hasWarnings ? "#F2B01E" : "#1A1916") : "#E7E2D6", color: canContinue ? (hasWarnings ? "#1A1916" : "#fff") : "#9A9486", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: canContinue ? "pointer" : "not-allowed", boxShadow: canContinue && hasWarnings ? "0 2px 0 #C98F11" : "none" }}
            >
              {hasWarnings ? "Continue with warnings →" : "Continue to export setup →"}
            </button>
            <button type="button" onClick={() => goToStep("mapping")} style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ← Back to placing fields
            </button>
          </aside>
        </div>
      </div>
    );
  };

  const renderCustomExportOptionsStep = () => {
    const { customDesign, csv } = session;
    if (!customDesign.asset || !csv) return null;

    const hasWarnings = preflightStatus === "readyWithWarnings";
    const canExport = isCustomExportReady;
    const statusBg = canExport ? "#EEF8F1" : "#FBEEEA";
    const statusBorder = canExport ? "#CDEBD9" : "#F2C9BD";
    const statusIcon = canExport ? "✓" : "×";
    const statusTitle = canExport ? "Ready to generate" : "Adjust export setup";
    let statusBody = "Choose how the final PDFs should be arranged.";

    if (canExport && hasWarnings) {
      statusBody = "Text fit has warnings, but this export setup is valid.";
    } else if (canExport) {
      statusBody = "The text fit check passed and this export setup is valid.";
    } else if (preflightStatus !== "ready" && preflightStatus !== "readyWithWarnings") {
      statusBody = "Go back to preview and finish the text-fit check before exporting.";
    } else if (isPrintSheets && !layoutCanCalculate) {
      statusBody = "The page preview cannot fit any finished items yet. Try a larger page, smaller margins, or smaller gaps.";
    }

    return (
      <div>
        <div style={STEP_LABEL_STYLE}>Step 6 · Export setup</div>
        <h2 style={H2}>How should the final pages look?</h2>
        <p style={{ ...SUBTEXT, maxWidth: 680 }}>
          Pick one PDF per row, or place multiple finished designs on each page for printing and cutting.
        </p>
        <HelpfulTip style={{ maxWidth: 720, marginBottom: 16 }}>
          Use one PDF per row for certificates. Use multiple per page for badges, tickets, labels, and anything you will cut after printing.
        </HelpfulTip>

        <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <CustomExportLayoutPreview
              exportOptions={session.customExportOptions}
              design={customDesign.asset}
              rowCount={csvRowCount}
              freeRows={freeRows}
              sheetLayoutInfo={sheetLayoutInfo}
            />

            <CustomExportOptionsPanel
              exportOptions={session.customExportOptions}
              design={customDesign.asset}
              csvHeaders={csv.headers}
              onChange={handleCustomExportOptionsChange}
              showItemSizeControls={false}
            />
          </div>

          <aside data-raside style={{ position: "sticky", top: 130 }}>
            <div style={{ background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "#fff", border: `1px solid ${statusBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{statusIcon}</span>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{statusTitle}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "12px 0 0", color: "#4A463E" }}>{statusBody}</p>
            </div>
            <HelpfulTip style={{ marginBottom: 12 }}>
              The outline preview is a quick check for spacing. It does not need to render every name to show whether the sheet layout fits.
            </HelpfulTip>

            <button
              type="button"
              disabled={!canExport}
              onClick={handleContinueToFinalExport}
              style={{ width: "100%", background: canExport ? "#1A1916" : "#E7E2D6", color: canExport ? "#fff" : "#9A9486", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: canExport ? "pointer" : "not-allowed" }}
            >
              Continue to generate →
            </button>
            <button type="button" onClick={() => goToStep("preview")} style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ← Back to preview
            </button>
          </aside>
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    const exportStatus = isStarterMode ? starterExportStatus : customExportStatus;
    const exportError = isStarterMode ? starterExportError : customExportError;
    const zipName = isStarterMode ? "batch-pdf-free-export.zip" : "batch-pdf-custom-export.zip";
    const doExport = isStarterMode ? handleStarterExport : handleCustomExport;
    const ptToIn = (pt: number) => `${(pt / 72).toFixed(2)} in`;
    const summary: [string, string][] = isStarterMode
      ? [["Template", selectedTemplate?.name ?? "—"], ["Rows in CSV", String(csvRowCount)], ["PDFs in this export", String(freeRows)]]
      : isPrintSheets && sheetLayoutInfo
        ? [
            ["Design", session.customDesign.asset?.fileName ?? "—"],
            ["Rows in CSV", String(csvRowCount)],
            ["Page size", `${ptToIn(sheetLayoutInfo.pageWidthPt)} × ${ptToIn(sheetLayoutInfo.pageHeightPt)}`],
            ["Item size", `${ptToIn(sheetLayoutInfo.itemWidthPt)} × ${ptToIn(sheetLayoutInfo.itemHeightPt)}`],
            ["Items per page", String(sheetLayoutInfo.layout.itemsPerPage)],
            ["Sheet pages", String(sheetLayoutInfo.layout.pageCount)],
          ]
        : [["Design", session.customDesign.asset?.fileName ?? "—"], ["Rows in CSV", String(csvRowCount)], ["PDFs in this export", String(freeRows)]];
    const customButtonLabel = isPrintSheets
      ? "Generate free print-sheet ZIP ↓"
      : "Generate free custom ZIP ↓";

    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <div style={STEP_LABEL_STYLE}>{isCustomMode ? "Step 7" : "Step 6"} · Export</div>
          <h2 style={H2}>{isStarterMode ? "Generate your free ZIP" : "Generate your custom ZIP"}</h2>
          <p style={{ ...SUBTEXT, maxWidth: 460, margin: "0 auto 24px" }}>
            We&apos;ll render {freeRows} personalized PDF{freeRows !== 1 ? "s" : ""} and pack them into a ZIP you can download.
          </p>
          <HelpfulTip style={{ maxWidth: 500, margin: "0 auto 18px", textAlign: "left" }}>
            For a real event, print one test page first before printing the full batch.
          </HelpfulTip>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E7E2D6", borderRadius: 20, padding: 24, boxShadow: "0 24px 50px -34px rgba(26,25,22,0.3)" }}>
          {exportStatus === "idle" && (
            <div>
              {summary.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #F4F1E9" }}>
                  <span style={{ fontSize: 13.5, color: "#6E6A61" }}>{k}</span>
                  <span style={{ ...MONO, fontSize: 13.5, fontWeight: 700, color: "#1A1916" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, background: "#FBEFCB", borderRadius: 12, padding: "13px 15px" }}>
                <span style={{ color: "#8A6A12", fontSize: 15 }}>★</span>
                <div style={{ fontSize: 13, color: "#7A5E12", lineHeight: 1.5 }}>
                  This batch generates up to <strong>{BATCH_PDF_LIMITS.freeExportRows} PDFs</strong> and packs them into a single ZIP.
                </div>
              </div>
              <button type="button" onClick={doExport} style={{ width: "100%", marginTop: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "#F2B01E", color: "#1A1916", fontWeight: 700, fontSize: 16, padding: 15, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 2px 0 #C98F11, 0 12px 26px -10px rgba(242,176,30,0.6)" }}>
                {isStarterMode ? "Generate free ZIP ↓" : customButtonLabel}
              </button>
              <button type="button" onClick={() => goToStep(isCustomMode ? "export-options" : "preview")} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Back</button>
            </div>
          )}

          {exportStatus === "loading" && (
            <ExportLoadingAnimation freeRows={freeRows} isPrintSheets={isPrintSheets} />
          )}

          {exportStatus === "success" && (
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#2E8B57", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Your ZIP is ready</div>
              <div style={{ fontSize: 14, color: "#6E6A61", marginTop: 6 }}>
                {freeRows} personalized PDF{freeRows !== 1 ? "s" : ""} packed into <span style={MONO}>{zipName}</span>
              </div>
              <button type="button" onClick={doExport} style={{ width: "100%", marginTop: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "#1A1916", color: "#fff", fontWeight: 700, fontSize: 16, padding: 15, border: "none", borderRadius: 12, cursor: "pointer" }}>↓ Download again</button>
              <button type="button" onClick={() => router.push("/")} style={{ width: "100%", marginTop: 8, background: "#fff", border: "1.5px solid #DAD3C4", color: "#1A1916", fontWeight: 700, fontSize: 14, padding: 12, borderRadius: 11, cursor: "pointer" }}>Start a new batch</button>
            </div>
          )}

          {exportStatus === "error" && (
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FBEEEA", color: "#B5482E", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16, border: "1px solid #F2C9BD" }}>⚠</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Something went wrong</div>
              <div style={{ fontSize: 14, color: "#6E6A61", marginTop: 6, lineHeight: 1.5 }}>{exportError ?? "We couldn't finish generating your PDFs. Please try again."}</div>
              <button type="button" onClick={doExport} style={{ width: "100%", marginTop: 20, background: "#F2B01E", color: "#1A1916", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 2px 0 #C98F11" }}>Try again</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────

  const isCustomPlacementStep = Boolean(
    session.csv && session.step === "mapping" && isCustomMode,
  );
  const createShellMaxWidth = isCustomPlacementStep
    ? "min(1360px, calc(100vw - 40px))"
    : "min(1180px, calc(100vw - 40px))";
  const createShellPadding = isCustomPlacementStep
    ? "clamp(18px, 2.4vh, 26px) clamp(14px, 2vw, 24px) 64px"
    : "clamp(22px, 3vh, 34px) clamp(18px, 3vw, 32px) 80px";

  return (
    <div>
      <UtilityStepper steps={buildSteps()} />

      <div
        style={{
          maxWidth: createShellMaxWidth,
          margin: "0 auto",
          padding: createShellPadding,
        }}
        data-rpad
      >
        {!session.csv && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#8A857A", fontSize: 15 }}>
            Loading…
          </div>
        )}
        {session.csv && session.step === "choose-design" && renderChooseDesign()}
        {session.csv && session.step === "setup-design" && isStarterMode && renderStep3a()}
        {session.csv && session.step === "setup-design" && isCustomMode && renderStep3b()}
        {session.csv && session.step === "mapping" && isStarterMode && renderStep4a()}
        {session.csv && session.step === "mapping" && isCustomMode && renderStep4b()}
        {session.csv && session.step === "preview" && isStarterMode && renderStep5a()}
        {session.csv && session.step === "preview" && isCustomMode && renderStep5b()}
        {session.csv && session.step === "export-options" && isCustomMode && renderCustomExportOptionsStep()}
        {session.csv && session.step === "export" && renderStep6()}
      </div>

      <style>{`
        @keyframes vsSpin { to { transform: rotate(360deg); } }
        @keyframes vsExportPage {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-8px) rotate(var(--r, 0deg)); }
        }
        @keyframes vsExportSpark {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(0.76) rotate(45deg); opacity: 0.72; }
        }
        @keyframes vsExportBar {
          0% { background-position: 0% 50%; }
          100% { background-position: 220% 50%; }
        }
        .vs-export-page { animation: vsExportPage 1.25s ease-in-out infinite; }
        .vs-export-page:nth-child(1) { --r: -5deg; }
        .vs-export-page:nth-child(2) { --r: 0deg; }
        .vs-export-page:nth-child(3) { --r: 5deg; }
        .vs-export-spark { animation: vsExportSpark 1.1s ease-in-out infinite; }
        .vs-choice-card:hover { border-color: #F2B01E !important; transform: translateY(-3px); box-shadow: 0 18px 36px -22px rgba(26,25,22,0.3) !important; }
        .vs-tpl-card:hover { border-color: #F2B01E !important; box-shadow: 0 8px 20px -10px rgba(26,25,22,0.15) !important; }
        @media (max-width: 900px) {
          [data-rcol] { grid-template-columns: 1fr !important; }
          [data-rcol4] { grid-template-columns: 1fr !important; }
          [data-raside] { position: static !important; top: auto !important; }
        }
        @media (max-width: 560px) {
          [data-rpad] { padding-left: 18px !important; padding-right: 18px !important; }
        }
      `}</style>
    </div>
  );
}
