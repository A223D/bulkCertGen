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
import { calculateSheetLayout } from "@/lib/batch-pdf/custom/sheet-layout";
import { BATCH_PDF_LIMITS } from "@/lib/batch-pdf/limits";
import type { BatchPdfError, CsvParseResult, FieldMapping } from "@/lib/batch-pdf/types";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "@/lib/batch-pdf/custom/types";
import type { CustomDesignPreflightResult } from "@/lib/batch-pdf/custom/preflight";

// ── Types ─────────────────────────────────────────────────────────────────────

type BatchPdfStep = "choose-design" | "setup-design" | "mapping" | "preview" | "export";
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

const STEP_ORDER: BatchPdfStep[] = [
  "choose-design",
  "setup-design",
  "mapping",
  "preview",
  "export",
];

const STEP_LABELS = ["Choose design", "Set up design", "Map fields", "Preview", "Export"];

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

  // Load CSV from sessionStorage on mount; redirect if missing
  useEffect(() => {
    const stored = loadSessionCsv();
    if (!stored) {
      router.replace("/");
      return;
    }
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
  const sheetLayoutInfo = useMemo(() => {
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
    const currentIdx = STEP_ORDER.indexOf(session.step);
    return [
      { n: 1, label: "Upload CSV", state: "complete", onClick: () => router.push("/") },
      ...STEP_ORDER.map((stepKey, i) => ({
        n: i + 2,
        label: STEP_LABELS[i],
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
    setSession((s) => ({ ...s, step: "export" }));
  }

  const handleCustomDesignAcceptedFile = useCallback((file: File) => {
    setCustomExportStatus("idle");
    setCustomExportError(null);
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
      // points — preselect custom item sizing so the user just enters dimensions.
      const needsCustomItemSize = asset.intrinsicUnit === "px";
      return {
        ...s,
        customDesign: { ...s.customDesign, asset, errors: [] },
        customExportOptions: needsCustomItemSize
          ? { ...s.customExportOptions, itemSizeMode: "custom" }
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
    setSession((s) => ({ ...s, customExportOptions: options }));
  }, []);

  const handleCustomPreflightResultChange = useCallback(
    (result: CustomDesignPreflightResult | null) => {
      setSession((s) => ({ ...s, customPreflightResult: result }));
    },
    [],
  );

  async function handleStarterExport() {
    if (!session.csv || !session.selectedTemplateId) return;
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
        setStarterExportStatus("error");
        setStarterExportError("Export failed. Check your mapping and try again.");
        return;
      }
      const blob = await res.blob();
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
      setStarterExportStatus("error");
      setStarterExportError("Could not reach the export service. Check your connection.");
    }
  }

  async function handleCustomExport() {
    const { customDesign, csv, customExportOptions } = session;
    if (!csv || !customDesign.asset || !customDesign.file) return;
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
        setCustomExportError(msg);
        setCustomExportStatus("error");
        return;
      }
      const blob = await res.blob();
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
            Use your own PDF, PNG, or JPEG and place CSV fields on top of it exactly where you want them.
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
            A single-page PDF, or a PNG/JPEG image. You&apos;ll place your CSV fields on top of it in the next step.
          </p>
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
                  ...(customDesign.asset.pageCount ? [["Pages", String(customDesign.asset.pageCount)]] : []),
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F4F1E9", fontSize: 12.5 }}>
                    <span style={{ color: "#8A857A" }}>{k}</span>
                    <span style={{ ...MONO, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
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
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div style={STEP_LABEL_STYLE}>Step 4 · Place fields</div>
            <h2 style={{ ...H2, margin: "8px 0 4px" }}>Place your fields on the design</h2>
            <p style={{ fontSize: 14.5, color: "#57534A", margin: 0, maxWidth: 560 }}>Drop a CSV column or static text, then drag and resize it into place.</p>
          </div>
        </div>

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
            Check text fit →
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
    if (!customDesign.asset || !csv) return null;

    const canExport = isCustomExportReady;
    const hasWarnings = preflightStatus === "readyWithWarnings";

    let sBg = "#F4F1E9", sBorder = "#E7E2D6", sIcon = "…", sTitle = "Checking…", sBody = "Running preflight checks on your field placements.";
    if (canExport && hasWarnings) { sBg = "#FBEFCB"; sBorder = "#F0DFA8"; sIcon = "⚠"; sTitle = "Ready with warnings"; sBody = "Some values may be adjusted during export. Review the issues below."; }
    else if (canExport) { sBg = "#EEF8F1"; sBorder = "#CDEBD9"; sIcon = "✓"; sTitle = "Ready to export"; sBody = "Every value fits its field. You're good to go."; }
    else if (preflightStatus === "blocked") { sBg = "#FBEEEA"; sBorder = "#F2C9BD"; sIcon = "✕"; sTitle = "Issues to fix"; sBody = "Fix the highlighted preflight issues before exporting."; }
    else if (preflightStatus === "needsOutputSize") { sIcon = "↕"; sTitle = "Set print size"; sBody = "Enter the item print size in export options to continue."; }
    else if (isPrintSheets && !layoutCanCalculate) { sBg = "#FBEEEA"; sBorder = "#F2C9BD"; sIcon = "✕"; sTitle = "Layout doesn't fit"; sBody = "No item fits on the page with these margins. Reduce margins, gaps, or item size."; }

    return (
      <div>
        <div style={STEP_LABEL_STYLE}>Step 5 · Check fit</div>
        <h2 style={H2}>Will every row fit?</h2>
        <p style={{ ...SUBTEXT, maxWidth: 640 }}>We check each row&apos;s values against your field boxes so you don&apos;t get clipped text.</p>

        <div data-rcol style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <CustomExportOptionsPanel
              exportOptions={session.customExportOptions}
              design={customDesign.asset}
              csvHeaders={csv.headers}
              onChange={handleCustomExportOptionsChange}
            />
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
            <button
              type="button"
              disabled={!canExport}
              onClick={handleContinueToExport}
              style={{ width: "100%", background: canExport ? (hasWarnings ? "#F2B01E" : "#1A1916") : "#E7E2D6", color: canExport ? (hasWarnings ? "#1A1916" : "#fff") : "#9A9486", fontWeight: 700, fontSize: 15, padding: 14, border: "none", borderRadius: 11, cursor: canExport ? "pointer" : "not-allowed", boxShadow: canExport && hasWarnings ? "0 2px 0 #C98F11" : "none" }}
            >
              {hasWarnings ? "Export anyway →" : "Continue to export →"}
            </button>
            <button type="button" onClick={() => goToStep("mapping")} style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ← Back to placing fields
            </button>
          </aside>
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    const exportStatus = isStarterMode ? starterExportStatus : customExportStatus;
    const exportError = isStarterMode ? starterExportError : customExportError;
    const overFreeCount = Math.max(0, csvRowCount - BATCH_PDF_LIMITS.freeExportRows);
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
          <div style={STEP_LABEL_STYLE}>Step 6 · Export</div>
          <h2 style={H2}>{isStarterMode ? "Generate your free ZIP" : "Generate your custom ZIP"}</h2>
          <p style={{ ...SUBTEXT, maxWidth: 460, margin: "0 auto 24px" }}>
            We&apos;ll render {freeRows} personalized PDF{freeRows !== 1 ? "s" : ""} and pack them into a ZIP you can download.
          </p>
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
                  The free export generates your first <strong>{BATCH_PDF_LIMITS.freeExportRows} PDFs</strong>.
                  {overFreeCount > 0 && <> Your remaining {overFreeCount} rows stay queued — full export isn&apos;t available yet.</>}
                </div>
              </div>
              <button type="button" onClick={doExport} style={{ width: "100%", marginTop: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "#F2B01E", color: "#1A1916", fontWeight: 700, fontSize: 16, padding: 15, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 2px 0 #C98F11, 0 12px 26px -10px rgba(242,176,30,0.6)" }}>
                {isStarterMode ? "Generate free ZIP ↓" : customButtonLabel}
              </button>
              <button type="button" onClick={() => goToStep("preview")} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: "#8A857A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Back</button>
            </div>
          )}

          {exportStatus === "loading" && (
            <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", border: "3px solid #F0DFA8", borderTopColor: "#F2B01E", margin: "0 auto 18px", animation: "vsSpin .8s linear infinite" }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>Generating your PDFs…</div>
              <div style={{ fontSize: 13, color: "#8A857A", marginTop: 5 }}>{freeRows} PDF{freeRows !== 1 ? "s" : ""} in this batch</div>
            </div>
          )}

          {exportStatus === "success" && (
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#2E8B57", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Your ZIP is ready</div>
              <div style={{ fontSize: 14, color: "#6E6A61", marginTop: 6 }}>
                {freeRows} personalized PDF{freeRows !== 1 ? "s" : ""} packed into <span style={MONO}>batch.zip</span>
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

  return (
    <div>
      <UtilityStepper steps={buildSteps()} />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 32px 80px" }} data-rpad>
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
        {session.csv && session.step === "export" && renderStep6()}
      </div>

      <style>{`
        @keyframes vsSpin { to { transform: rotate(360deg); } }
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
