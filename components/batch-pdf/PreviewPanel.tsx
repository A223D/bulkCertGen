type PreviewPanelProps = {
  templateName: string;
  mappingReady?: boolean;
  isActive?: boolean;
};

export function PreviewPanel({
  templateName,
  mappingReady = false,
  isActive = false,
}: PreviewPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preview
          </p>
          <h2 className="mt-2 text-xl font-semibold">{templateName}</h2>
        </div>
        <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {isActive ? "Ready later" : "Placeholder"}
        </span>
      </div>

      <div className="mt-5 flex min-h-72 items-center justify-center rounded-lg border border-dashed border-line bg-muted p-6">
        <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 text-center">
          <p className="text-sm font-semibold text-ink">{templateName}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mappingReady
              ? "Mapping is ready. Phase 4 will render a document preview here."
              : "Map required fields before preview is available."}
          </p>
        </div>
      </div>
    </section>
  );
}
