import { getAllTemplates } from "@/lib/batch-pdf/template-registry";

export function SampleCsvLinks() {
  const templates = getAllTemplates();

  return (
    <section className="rounded-lg border border-dashed border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Sample CSVs
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Downloadable sample files arrive in Phase 2. For now, these placeholders
        confirm each starter template has registry metadata.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled
            className="rounded-full border border-line bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            {template.shortName} sample
          </button>
        ))}
      </div>
    </section>
  );
}
