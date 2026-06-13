"use client";

import { useState } from "react";
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
import { clampPreviewRowIndex } from "@/lib/batch-pdf/preview";
import {
  getTemplateById,
} from "@/lib/batch-pdf/template-registry";
import type {
  CsvParseResult,
  FieldMapping,
} from "@/lib/batch-pdf/types";

type BatchPdfStep = "upload" | "template" | "mapping" | "preview" | "export";

type BatchPdfSessionState = {
  step: BatchPdfStep;
  csv: CsvParseResult | null;
  selectedTemplateId: string | null;
  mapping: FieldMapping;
  previewRowIndex: number;
};

export function BatchPdfClient() {
  const [session, setSession] = useState<BatchPdfSessionState>({
    step: "upload",
    csv: null,
    selectedTemplateId: null,
    mapping: {},
    previewRowIndex: 0,
  });
  const selectedTemplate = getTemplateById(session.selectedTemplateId ?? "");
  const hasCsv = Boolean(session.csv);
  const mappingValidation =
    selectedTemplate && session.csv
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
  const hasSelectedTemplate = Boolean(selectedTemplate);
  const isPreviewAvailable =
    isMappingValid && (session.step === "preview" || session.step === "export");
  const isExportAvailable = isMappingValid && session.step === "export";
  const steps = [
    { id: "upload", label: "Upload CSV", complete: hasCsv },
    {
      id: "template",
      label: "Choose template",
      disabled: !hasCsv,
      complete: hasSelectedTemplate,
    },
    {
      id: "mapping",
      label: "Map fields",
      disabled: !hasSelectedTemplate,
      complete: isMappingValid,
    },
    {
      id: "preview",
      label: "Preview",
      disabled: !isMappingValid,
      complete: isPreviewAvailable,
    },
    {
      id: "export",
      label: "Export",
      disabled: !isMappingValid,
      complete: isExportAvailable,
    },
  ];

  function handleCsvParsed(csv: CsvParseResult) {
    setSession((current) => ({
      ...current,
      step: "template",
      csv,
      mapping: {},
      previewRowIndex: 0,
      selectedTemplateId: null,
    }));
  }

  function handleCsvReset() {
    setSession((current) => ({
      ...current,
      step: "upload",
      csv: null,
      selectedTemplateId: null,
      mapping: {},
      previewRowIndex: 0,
    }));
  }

  function handleSelectTemplate(templateId: string) {
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
      selectedTemplateId: templateId,
      mapping: autoMapFields(template, session.csv?.headers ?? []),
      previewRowIndex: 0,
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
              Upload a CSV, confirm the parsed rows and columns, then choose a
              starter template. Map required fields before continuing to the
              preview placeholder.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
            Your CSV will be used only to generate PDFs. Uploaded spreadsheets
            and generated files will not be stored.
          </div>
        </div>
      </section>

      <UtilityStepper currentStepId={session.step} steps={steps} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <CsvUpload
            csv={session.csv}
            onCsvParsed={handleCsvParsed}
            onCsvReset={handleCsvReset}
          />

          <SampleCsvLinks />

          <TemplatePicker
            selectedTemplateId={session.selectedTemplateId ?? ""}
            onSelectTemplate={handleSelectTemplate}
            disabled={!session.csv}
          />

          {selectedTemplate && session.csv ? (
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
        </div>

        <aside className="space-y-6">
          <ValidationSummary
            csv={session.csv}
            templateName={selectedTemplate?.name ?? null}
            errors={mappingErrors}
            warnings={missingValueWarnings}
            isMappingValid={isMappingValid}
          />
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
        </aside>
      </div>
    </div>
  );
}
