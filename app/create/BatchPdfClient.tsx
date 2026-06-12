"use client";

import { useMemo, useState } from "react";
import { ExportPanel } from "@/components/batch-pdf/ExportPanel";
import { PreviewPanel } from "@/components/batch-pdf/PreviewPanel";
import { SampleCsvLinks } from "@/components/batch-pdf/SampleCsvLinks";
import { TemplatePicker } from "@/components/batch-pdf/TemplatePicker";
import { UtilityStepper } from "@/components/batch-pdf/UtilityStepper";
import { ValidationSummary } from "@/components/batch-pdf/ValidationSummary";
import {
  getAllTemplates,
  getTemplateById,
} from "@/lib/batch-pdf/template-registry";

const steps = [
  { id: "upload", label: "Upload CSV" },
  { id: "template", label: "Choose template" },
  { id: "mapping", label: "Map fields" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Export" },
];

export function BatchPdfClient() {
  const firstTemplateId = useMemo(() => getAllTemplates()[0]?.id ?? "", []);
  const [selectedTemplateId, setSelectedTemplateId] = useState(firstTemplateId);
  const selectedTemplate = getTemplateById(selectedTemplateId);

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
              Select a starter template and review the planned flow. CSV upload,
              mapping, preview data, and export are intentionally inactive in
              this phase.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
            Your CSV will be used only to generate PDFs. Uploaded spreadsheets
            and generated files will not be stored.
          </div>
        </div>
      </section>

      <UtilityStepper currentStepId="template" steps={steps} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-dashed border-line bg-panel p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Upload CSV
            </p>
            <h2 className="mt-2 text-lg font-semibold">Upload starts in Phase 2</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This placeholder reserves the first step without processing user
              data.
            </p>
          </section>

          <TemplatePicker
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
          />

          <section className="rounded-lg border border-line bg-panel p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Template fields
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {selectedTemplate?.fields.map((field) => (
                <div key={field.key} className="rounded-lg border border-line bg-muted p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{field.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{field.key}</p>
                    </div>
                    <span className="rounded-full bg-panel px-2 py-1 text-xs font-medium text-muted-foreground">
                      {field.required ? "Required" : "Optional"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <SampleCsvLinks />
        </div>

        <aside className="space-y-6">
          <ValidationSummary />
          <PreviewPanel templateName={selectedTemplate?.name ?? "Template"} />
          <ExportPanel />
        </aside>
      </div>
    </div>
  );
}
