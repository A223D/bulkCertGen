import { getAllSampleCsvs } from "@/lib/batch-pdf/sample-csv";
import { assertTemplateExists } from "@/lib/batch-pdf/template-registry";

type SampleCsvLinksProps = {
  onLoadSample?: (templateId: string) => void;
  loadError?: string | null;
};

export function SampleCsvLinks({
  onLoadSample,
  loadError = null,
}: SampleCsvLinksProps) {
  const samples = getAllSampleCsvs();

  return (
    <section className="rounded-lg border border-dashed border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Sample CSVs
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Download a matching CSV or load sample rows directly to try the flow.
        Sample data stays in this browser session until you export.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {samples.map((sample) => {
          const template = assertTemplateExists(sample.templateId);

          return (
            <div
              key={sample.templateId}
              className="rounded-lg border border-line bg-muted p-3"
            >
              <p className="text-sm font-semibold text-ink">
                {template.shortName}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {sample.fileName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {onLoadSample ? (
                  <button
                    type="button"
                    onClick={() => onLoadSample(sample.templateId)}
                    className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-panel hover:bg-accent"
                  >
                    Try sample
                  </button>
                ) : null}
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(sample.csv)}`}
                  download={sample.fileName}
                  className="rounded-lg border border-line bg-panel px-3 py-2 text-xs font-medium text-muted-foreground hover:border-accent hover:text-accent"
                  type="text/csv;charset=utf-8"
                >
                  Download CSV
                </a>
              </div>
            </div>
          );
        })}
      </div>
      {loadError ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}
    </section>
  );
}
