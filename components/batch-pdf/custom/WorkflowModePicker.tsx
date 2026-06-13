"use client";

export type BatchPdfWorkflowMode = "starterTemplate" | "customDesign";

type WorkflowModePickerProps = {
  selectedMode: BatchPdfWorkflowMode | null;
  disabled?: boolean;
  onSelectMode: (mode: BatchPdfWorkflowMode) => void;
};

const options: Array<{
  id: BatchPdfWorkflowMode;
  title: string;
  description: string;
}> = [
  {
    id: "starterTemplate",
    title: "Use a starter template",
    description: "Choose one of the built-in certificate, badge, label, or card templates.",
  },
  {
    id: "customDesign",
    title: "Upload my own design",
    description: "Use a PDF, PNG, JPG, or JPEG design and place CSV fields on it.",
  },
];

export function WorkflowModePicker({
  selectedMode,
  disabled = false,
  onSelectMode,
}: WorkflowModePickerProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4" aria-labelledby="workflow-mode-heading">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Design source
        </p>
        <h2 id="workflow-mode-heading" className="mt-2 text-xl font-semibold">
          Choose how to start the design
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Keep using a starter template, or preview your own design for field placement in the next phase.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedMode === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelectMode(option.id)}
              className={[
                "rounded-lg border p-4 text-left transition-colors",
                disabled ? "cursor-not-allowed opacity-60" : "",
                isSelected
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-panel hover:border-accent",
              ].join(" ")}
            >
              <span className="block text-base font-semibold text-ink">
                {option.title}
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
