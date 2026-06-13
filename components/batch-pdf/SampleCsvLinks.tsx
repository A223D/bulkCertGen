import { getAllSampleCsvs } from "@/lib/batch-pdf/sample-csv";
import { assertTemplateExists } from "@/lib/batch-pdf/template-registry";

export function SampleCsvLinks() {
  const samples = getAllSampleCsvs();

  return (
    <section className="rounded-lg border border-dashed border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Sample CSVs
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Download a small CSV that matches one of the starter templates, then
        upload it above to test the import flow.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {samples.map((sample) => {
          const template = assertTemplateExists(sample.templateId);

          return (
            <a
              key={sample.templateId}
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(sample.csv)}`}
              download={sample.fileName}
              className="rounded-full border border-line bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:border-accent hover:text-accent"
              type="text/csv;charset=utf-8"
            >
              {template.shortName} sample
            </a>
          );
        })}
      </div>
    </section>
  );
}
