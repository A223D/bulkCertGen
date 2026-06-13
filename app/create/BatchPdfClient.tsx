"use client";

import { useCallback, useState } from "react";
import { CustomDesignMetadataPanel } from "@/components/batch-pdf/custom/CustomDesignMetadataPanel";
import { CustomDesignSetupPanel } from "@/components/batch-pdf/custom/CustomDesignSetupPanel";
import {
  WorkflowModePicker,
  type BatchPdfWorkflowMode,
} from "@/components/batch-pdf/custom/WorkflowModePicker";
import { CsvUpload } from "@/components/batch-pdf/CsvUpload";
import { ExportPanel } from "@/components/batch-pdf/ExportPanel";
import { FieldMapper } from "@/components/batch-pdf/FieldMapper";
import { PreviewPanel } from "@/components/batch-pdf/PreviewPanel";
import { SampleCsvLinks } from "@/components/batch-pdf/SampleCsvLinks";
import { TemplatePicker } from "@/components/batch-pdf/TemplatePicker";
import { UtilityStepper } from "@/components/batch-pdf/UtilityStepper";
import { ValidationSummary } from "@/components/batch-pdf/ValidationSummary";
import {
  autoMapFields,
  getMissingValueWarnings,
  validateMapping,
} from "@/lib/batch-pdf/mapping";
import { parseCsvText } from "@/lib/batch-pdf/csv";
import { clampPreviewRowIndex } from "@/lib/batch-pdf/preview";
import { getSampleCsvByTemplateId } from "@/lib/batch-pdf/sample-csv";
import {
  getTemplateById,
} from "@/lib/batch-pdf/template-registry";
import {
  createEmptyCustomDesignState,
  isCustomDesignPreviewReady,
  resetCustomDesignState,
  type CustomDesignPreviewStatus,
  type CustomDesignState,
} from "@/lib/batch-pdf/custom/design-upload-state";
import { isCustomFieldPlacementReady } from "@/lib/batch-pdf/custom/field-box-state";
import type {
  BatchPdfError,
  CsvParseResult,
  FieldMapping,
} from "@/lib/batch-pdf/types";
import type { CustomFieldBox, DesignAsset } from "@/lib/batch-pdf/custom/types";

type BatchPdfStep = "upload" | "template" | "mapping" | "preview" | "export";

type BatchPdfSessionState = {
  step: BatchPdfStep;
  workflowMode: BatchPdfWorkflowMode | null;
  csv: CsvParseResult | null;
  selectedTemplateId: string | null;
  mapping: FieldMapping;
  previewRowIndex: number;
  customDesign: CustomDesignState;
};

export function BatchPdfClient() {
  const [session, setSession] = useState<BatchPdfSessionState>({
    step: "upload",
    workflowMode: null,
    csv: null,
    selectedTemplateId: null,
    mapping: {},
    previewRowIndex: 0,
    customDesign: createEmptyCustomDesignState(),
  });
  const [sampleError, setSampleError] = useState<string | null>(null);
  const selectedTemplate = getTemplateById(session.selectedTemplateId ?? "");
  const isStarterTemplateMode = session.workflowMode === "starterTemplate";
  const isCustomDesignMode = session.workflowMode === "customDesign";
  const hasCsv = Boolean(session.csv);
  const customDesignPreviewReady = isCustomDesignPreviewReady(session.customDesign);
  const mappingValidation =
    isStarterTemplateMode && selectedTemplate && session.csv
      ? validateMapping(selectedTemplate, session.csv.headers, session.mapping)
      : null;
  const mappingErrors = mappingValidation && !mappingValidation.ok
    ? mappingValidation.errors
    : [];
  const missingValueWarnings =
    selectedTemplate && session.csv
      ? getMissingValueWarnings(
          session.csv.rows,
          session.mapping,
          selectedTemplate,
        )
      : [];
  const isMappingValid = Boolean(mappingValidation?.ok);
  const hasSelectedTemplate = isStarterTemplateMode && Boolean(selectedTemplate);
  const isCustomFieldReady =
    isCustomDesignMode && session.csv
      ? isCustomFieldPlacementReady({
          boxes: session.customDesign.fieldBoxes,
          csvHeaders: session.csv.headers,
        })
      : false;
  const isPreviewAvailable =
    isMappingValid && (session.step === "preview" || session.step === "export");
  const isExportAvailable = isMappingValid && session.step === "export";
  const currentStepId =
    isCustomDesignMode && customDesignPreviewReady ? "mapping" : session.step;
  const chooseDesignComplete = isStarterTemplateMode
    ? hasSelectedTemplate
    : isCustomDesignMode && Boolean(session.customDesign.asset);
  const steps = [
    { id: "upload", label: "Upload CSV", complete: hasCsv },
    {
      id: "template",
      label: "Choose design",
      disabled: !hasCsv,
      complete: chooseDesignComplete,
    },
    {
      id: "mapping",
      label: "Add fields",
      disabled: isStarterTemplateMode ? !hasSelectedTemplate : !customDesignPreviewReady,
      complete: isStarterTemplateMode ? isMappingValid : isCustomFieldReady,
    },
    {
      id: "preview",
      label: "Preview",
      disabled: isStarterTemplateMode ? !isMappingValid : !isCustomFieldReady,
      complete: isStarterTemplateMode ? isPreviewAvailable : isCustomFieldReady,
    },
    {
      id: "export",
      label: "Export",
      disabled: isCustomDesignMode || !isMappingValid,
      complete: isStarterTemplateMode ? isExportAvailable : false,
    },
  ];

  function handleCsvParsed(csv: CsvParseResult) {
    setSampleError(null);
    setSession((current) => ({
      ...current,
      step: "template",
      workflowMode: null,
      csv,
      mapping: {},
      previewRowIndex: 0,
      selectedTemplateId: null,
      customDesign: resetCustomDesignState(),
    }));
  }

  function handleCsvReset() {
    setSampleError(null);
    setSession((current) => ({
      ...current,
      step: "upload",
      workflowMode: null,
      csv: null,
      selectedTemplateId: null,
      mapping: {},
      previewRowIndex: 0,
      customDesign: resetCustomDesignState(),
    }));
  }

  function handleSelectWorkflowMode(workflowMode: BatchPdfWorkflowMode) {
    setSampleError(null);
    setSession((current) => ({
      ...current,
      step: "template",
      workflowMode,
      selectedTemplateId:
        workflowMode === "starterTemplate" ? current.selectedTemplateId : null,
      mapping: workflowMode === "starterTemplate" ? current.mapping : {},
      previewRowIndex: 0,
      customDesign:
        workflowMode === "customDesign"
          ? resetCustomDesignState()
          : resetCustomDesignState(),
    }));
  }

  function handleSelectTemplate(templateId: string) {
    setSampleError(null);
    if (!session.csv) {
      return;
    }

    const template = getTemplateById(templateId);

    if (!template) {
      return;
    }

    setSession((current) => ({
      ...current,
      step: "mapping",
      workflowMode: "starterTemplate",
      selectedTemplateId: templateId,
      mapping: autoMapFields(template, session.csv?.headers ?? []),
      previewRowIndex: 0,
      customDesign: resetCustomDesignState(),
    }));
  }

  function handleLoadSample(templateId: string) {
    const template = getTemplateById(templateId);
    const sample = getSampleCsvByTemplateId(templateId);

    if (!template || !sample) {
      setSampleError("Sample data is not available for this template.");
      return;
    }

    const parsed = parseCsvText(sample.csv);

    if (!parsed.ok) {
      setSampleError("We could not load this sample CSV. Try downloading it instead.");
      return;
    }

    setSampleError(null);
    setSession((current) => ({
      ...current,
      step: "mapping",
      workflowMode: "starterTemplate",
      csv: parsed.value,
      selectedTemplateId: template.id,
      mapping: autoMapFields(template, parsed.value.headers),
      previewRowIndex: 0,
      customDesign: resetCustomDesignState(),
    }));
  }

  function handleMappingChange(fieldKey: string, csvHeader: string) {
    setSession((current) => {
      const nextMapping = { ...current.mapping };

      if (csvHeader === "") {
        delete nextMapping[fieldKey];
      } else {
        nextMapping[fieldKey] = csvHeader;
      }

      return {
        ...current,
        step: current.step === "preview" ? "preview" : "mapping",
        mapping: nextMapping,
      };
    });
  }

  function handleContinueToPreview() {
    if (!isMappingValid || !session.csv) {
      return;
    }

    setSession((current) => ({
      ...current,
      step: "preview",
      previewRowIndex: clampPreviewRowIndex(
        current.previewRowIndex,
        session.csv?.rows.length ?? 0,
      ),
    }));
  }

  const handleCustomDesignAcceptedFile = useCallback((file: File) => {
    setSession((current) => {
      if (current.customDesign.previewUrl) {
        URL.revokeObjectURL(current.customDesign.previewUrl);
      }

      return {
        ...current,
        step: "template",
        customDesign: {
          ...resetCustomDesignState(),
          file,
          previewStatus: "loading",
        },
      };
    });
  }, []);

  const handleCustomDesignRejectedFile = useCallback((errors: BatchPdfError[]) => {
    setSession((current) => {
      if (current.customDesign.previewUrl) {
        URL.revokeObjectURL(current.customDesign.previewUrl);
      }

      return {
        ...current,
        step: "template",
        customDesign: {
          ...resetCustomDesignState(),
          previewStatus: "error",
          errors,
        },
      };
    });
  }, []);

  const handleCustomDesignReset = useCallback(() => {
    setSession((current) => {
      if (current.customDesign.previewUrl) {
        URL.revokeObjectURL(current.customDesign.previewUrl);
      }

      return {
        ...current,
        step: "template",
        customDesign: resetCustomDesignState(),
      };
    });
  }, []);

  const handleCustomDesignAssetReady = useCallback((asset: DesignAsset) => {
    setSession((current) => ({
      ...current,
      step: "preview",
      customDesign: {
        ...current.customDesign,
        asset,
        errors: [],
      },
    }));
  }, []);

  const handleCustomDesignPreviewUrlChange = useCallback((previewUrl: string | null) => {
    setSession((current) => ({
      ...current,
      customDesign: {
        ...current.customDesign,
        previewUrl,
      },
    }));
  }, []);

  const handleCustomDesignPreviewStatusChange = useCallback((
    previewStatus: CustomDesignPreviewStatus,
  ) => {
    setSession((current) => ({
      ...current,
      customDesign: {
        ...current.customDesign,
        previewStatus,
      },
    }));
  }, []);

  const handleCustomDesignErrorsChange = useCallback((errors: BatchPdfError[]) => {
    setSession((current) => ({
      ...current,
      customDesign: {
        ...current.customDesign,
        errors,
      },
    }));
  }, []);

  const handleCustomFieldBoxesChange = useCallback((fieldBoxes: CustomFieldBox[]) => {
    setSession((current) => ({
      ...current,
      customDesign: {
        ...current.customDesign,
        fieldBoxes,
        selectedFieldBoxId: fieldBoxes.some(
          (box) => box.id === current.customDesign.selectedFieldBoxId,
        )
          ? current.customDesign.selectedFieldBoxId
          : fieldBoxes[0]?.id ?? null,
      },
    }));
  }, []);

  const handleSelectedFieldBoxChange = useCallback((selectedFieldBoxId: string | null) => {
    setSession((current) => ({
      ...current,
      customDesign: {
        ...current.customDesign,
        selectedFieldBoxId,
      },
    }));
  }, []);

  function handlePreviousPreviewRow() {
    if (!session.csv) {
      return;
    }

    setSession((current) => ({
      ...current,
      previewRowIndex: clampPreviewRowIndex(
        current.previewRowIndex - 1,
        session.csv?.rows.length ?? 0,
      ),
    }));
  }

  function handleNextPreviewRow() {
    if (!session.csv) {
      return;
    }

    setSession((current) => ({
      ...current,
      previewRowIndex: clampPreviewRowIndex(
        current.previewRowIndex + 1,
        session.csv?.rows.length ?? 0,
      ),
    }));
  }

  function handleBackToMapping() {
    if (!selectedTemplate) {
      return;
    }

    setSession((current) => ({
      ...current,
      step: "mapping",
    }));
  }

  function handleContinueToExport() {
    if (!isMappingValid || !selectedTemplate || !session.csv) {
      return;
    }

    setSession((current) => ({
      ...current,
      step: "export",
      previewRowIndex: clampPreviewRowIndex(
        current.previewRowIndex,
        session.csv?.rows.length ?? 0,
      ),
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Create
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Batch PDF builder
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Upload a CSV, choose a design, map your columns, preview your
              documents, and download a ZIP of PDFs.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
            Your CSV is used only for the current batch. We do not store
            uploaded spreadsheets or generated PDF files.
          </div>
        </div>
      </section>

      <UtilityStepper currentStepId={currentStepId} steps={steps} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <CsvUpload
            csv={session.csv}
            onCsvParsed={handleCsvParsed}
            onCsvReset={handleCsvReset}
          />

          <SampleCsvLinks
            onLoadSample={handleLoadSample}
            loadError={sampleError}
          />

          {session.csv ? (
            <WorkflowModePicker
              selectedMode={session.workflowMode}
              onSelectMode={handleSelectWorkflowMode}
            />
          ) : null}

          {isStarterTemplateMode ? (
            <TemplatePicker
              selectedTemplateId={session.selectedTemplateId ?? ""}
              onSelectTemplate={handleSelectTemplate}
              disabled={!session.csv}
            />
          ) : null}

          {isStarterTemplateMode && selectedTemplate && session.csv ? (
            <FieldMapper
              template={selectedTemplate}
              headers={session.csv.headers}
              mapping={session.mapping}
              errors={mappingErrors}
              warnings={missingValueWarnings}
              isValid={isMappingValid}
              onMappingChange={handleMappingChange}
              onContinue={handleContinueToPreview}
            />
          ) : null}

          {isCustomDesignMode ? (
            <CustomDesignSetupPanel
              state={session.customDesign}
              onAcceptedFile={handleCustomDesignAcceptedFile}
              onRejectedFile={handleCustomDesignRejectedFile}
              onReset={handleCustomDesignReset}
              onAssetReady={handleCustomDesignAssetReady}
              onPreviewUrlChange={handleCustomDesignPreviewUrlChange}
              onPreviewStatusChange={handleCustomDesignPreviewStatusChange}
              onErrorsChange={handleCustomDesignErrorsChange}
              csvHeaders={session.csv?.headers ?? []}
              onFieldBoxesChange={handleCustomFieldBoxesChange}
              onSelectedFieldBoxChange={handleSelectedFieldBoxChange}
            />
          ) : null}
        </div>

        <aside className="space-y-6">
          <ValidationSummary
            csv={session.csv}
            templateName={isStarterTemplateMode ? selectedTemplate?.name ?? null : null}
            errors={mappingErrors}
            warnings={missingValueWarnings}
            isMappingValid={
              isStarterTemplateMode ? isMappingValid : customDesignPreviewReady
            }
          />
          {isStarterTemplateMode ? (
            <>
              <PreviewPanel
                template={selectedTemplate}
                rows={session.csv?.rows ?? []}
                mapping={session.mapping}
                previewRowIndex={session.previewRowIndex}
                mappingReady={isPreviewAvailable}
                errors={mappingErrors}
                warnings={missingValueWarnings}
                onPreviousRow={handlePreviousPreviewRow}
                onNextRow={handleNextPreviewRow}
                onBackToMapping={handleBackToMapping}
                onContinueToExport={handleContinueToExport}
              />
              <ExportPanel
                templateId={selectedTemplate?.id ?? null}
                rows={session.csv?.rows ?? []}
                mapping={session.mapping}
                enabled={isExportAvailable && Boolean(session.csv)}
              />
            </>
          ) : null}
          {isCustomDesignMode ? (
            <>
              <CustomDesignMetadataPanel asset={session.customDesign.asset} />
              <section className="rounded-lg border border-line bg-panel p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Export
                </p>
                <h2 className="mt-2 text-lg font-semibold">Custom export is locked</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Text fit checks and custom rendering are coming next. Your placed fields stay in this browser session for now.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-4 cursor-not-allowed rounded-lg bg-disabled px-4 py-2 text-sm font-medium text-disabled-foreground"
                >
                  Generate custom ZIP
                </button>
              </section>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
