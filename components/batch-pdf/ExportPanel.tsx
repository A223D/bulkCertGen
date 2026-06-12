export function ExportPanel() {
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Export
      </p>
      <h2 className="mt-2 text-lg font-semibold">PDF export is not active yet</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Phase 1 only establishes the shell and template registry. ZIP generation
        and free export limits are planned for a later phase.
      </p>
      <button
        type="button"
        disabled
        className="mt-4 rounded-lg bg-disabled px-4 py-2 text-sm font-medium text-disabled-foreground"
      >
        Generate PDFs
      </button>
    </section>
  );
}
