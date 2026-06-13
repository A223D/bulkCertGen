type UtilityStep = {
  id: string;
  label: string;
  disabled?: boolean;
  complete?: boolean;
};

type UtilityStepperProps = {
  currentStepId: string;
  steps: UtilityStep[];
};

export function UtilityStepper({ currentStepId, steps }: UtilityStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <nav aria-label="Batch PDF progress">
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isComplete = step.complete ?? currentIndex > index;
          const isDisabled = step.disabled;

          return (
            <li
              key={step.id}
              className={[
                "flex min-h-14 items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2",
                isDisabled ? "opacity-55" : "",
              ].join(" ")}
              aria-current={isCurrent ? "step" : undefined}
              data-disabled={isDisabled || undefined}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isCurrent || isComplete
                    ? "bg-accent text-accent-contrast"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <span
                className={[
                  "text-sm font-medium leading-5",
                  isCurrent && !isDisabled ? "text-ink" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
