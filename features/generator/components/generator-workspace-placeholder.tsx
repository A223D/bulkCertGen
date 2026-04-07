const columns = ["full_name", "course_name", "issue_date"];

const placeholderFields = [
  { label: "Recipient name", position: "X: 50%, Y: 42%", source: "full_name" },
  { label: "Award title", position: "X: 50%, Y: 55%", source: "course_name" },
  { label: "Issue date", position: "X: 78%, Y: 82%", source: "issue_date" },
];

export function GeneratorWorkspacePlaceholder() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[1.75rem] border border-line bg-panel p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
          Project outline
        </p>
        <div className="mt-5 space-y-5">
          <section>
            <h2 className="text-lg font-semibold">Data columns</h2>
            <ul className="mt-3 space-y-2">
              {columns.map((column) => (
                <li
                  key={column}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-stone-700"
                >
                  {column}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Upcoming work</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              This page is reserved for the design canvas, row preview controls,
              and field inspector. Only the route and baseline layout are in
              place right now.
            </p>
          </section>
        </div>
      </aside>

      <section className="rounded-[1.75rem] border border-line bg-panel p-5 shadow-card">
        <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Generator workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Layout and preview surface
            </h1>
          </div>
          <div className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-stone-600">
            Export actions intentionally disabled in this foundation pass.
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[1.5rem] border border-line bg-[#f8f3e7] p-4">
            <div className="flex aspect-[1.414/1] items-center justify-center rounded-[1.25rem] border border-dashed border-stone-400/70 bg-white p-6">
              <div className="w-full max-w-2xl rounded-[1rem] border border-line bg-canvas p-6 shadow-sm">
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-[0.9rem] border border-dashed border-stone-300 bg-white px-8 py-10 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Certificate canvas placeholder
                  </p>
                  <p className="mt-6 text-4xl font-semibold">Recipient name</p>
                  <p className="mt-4 text-lg text-stone-600">Course or award title</p>
                  <p className="mt-16 text-sm text-stone-500">Issued on March 10, 2026</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-line bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Dynamic fields
              </p>
              <div className="mt-4 space-y-3">
                {placeholderFields.map((field) => (
                  <div
                    key={field.label}
                    className="rounded-2xl border border-line bg-panel p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{field.label}</p>
                        <p className="mt-1 text-sm text-stone-600">
                          Source column: {field.source}
                        </p>
                      </div>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        Draft
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-stone-600">{field.position}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Preview row
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                Future iterations can bind this panel to an active CSV row and
                live-update the canvas as fields are moved or restyled.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
