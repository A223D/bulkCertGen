"use client";

import { getAllTemplates } from "@/lib/batch-pdf/template-registry";

type TemplatePickerProps = {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  disabled?: boolean;
};

export function TemplatePicker({
  selectedTemplateId,
  onSelectTemplate,
  disabled = false,
}: TemplatePickerProps) {
  const templates = getAllTemplates();

  return (
    <section className="space-y-4" aria-labelledby="template-picker-heading">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Templates
        </p>
        <h2 id="template-picker-heading" className="mt-2 text-xl font-semibold">
          Choose a fixed layout
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          const requiredCount = template.fields.filter((field) => field.required).length;

          return (
            <button
              key={template.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTemplate(template.id)}
              className={[
                "rounded-lg border p-4 text-left transition-colors",
                disabled ? "cursor-not-allowed opacity-60" : "",
                isSelected
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-panel hover:border-accent",
              ].join(" ")}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-base font-semibold text-ink">
                    {template.name}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                    {template.description}
                  </span>
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {template.category}
                </span>
              </span>
              <span className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{template.fields.length} fields</span>
                <span aria-hidden="true">/</span>
                <span>{requiredCount} required</span>
                <span aria-hidden="true">/</span>
                <span>{template.free ? "Free starter" : "Paid"}</span>
              </span>
            </button>
          );
        })}
      </div>
      {disabled ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Upload a valid CSV before choosing a template.
        </p>
      ) : null}
    </section>
  );
}
