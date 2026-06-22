"use client";

export type WizardStep = {
  n: number;
  label: string;
  state: "complete" | "current" | "reachable" | "locked";
  onClick?: () => void;
};

type UtilityStepperProps = {
  steps: WizardStep[];
};

export function UtilityStepper({ steps }: UtilityStepperProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 62,
        zIndex: 40,
        background: "rgba(250,248,243,0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #E7E2D6",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px clamp(16px, 4vw, 32px)" }}>
        {/* Desktop stepper */}
        <nav
          aria-label="Batch PDF progress"
          className="vs-step-desktop"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {steps.map((step, i) => {
            const isCurrent = step.state === "current";
            const isComplete = step.state === "complete";
            const isReachable = step.state === "reachable" || isComplete || isCurrent;

            const numBg = isCurrent ? "#F2B01E" : isComplete ? "#1A1916" : "#fff";
            const numColor = isCurrent ? "#1A1916" : isComplete ? "#fff" : "#B0AA9C";
            const numBorder = isCurrent || isComplete ? "none" : "1px solid #DAD3C4";
            const numLabel = isComplete && !isCurrent ? "✓" : String(step.n);

            return (
              <div key={step.n} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? "none" : undefined }}>
                <button
                  type="button"
                  onClick={step.onClick}
                  disabled={!isReachable || !step.onClick}
                  aria-current={isCurrent ? "step" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 10,
                    cursor: step.onClick && isReachable ? "pointer" : "default",
                    background: isCurrent ? "#FFFFFF" : "transparent",
                    border: isCurrent ? "1px solid #F0DFA8" : "1px solid transparent",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: numBg,
                      color: numColor,
                      border: numBorder,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    {numLabel}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? "#1A1916" : isReachable ? "#6E6A61" : "#B0AA9C",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <span
                    style={{
                      flex: 1,
                      height: 2,
                      background: isComplete ? "#1A1916" : "#E7E2D6",
                      borderRadius: 2,
                      minWidth: 8,
                      margin: "0 2px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile stepper */}
        <div
          className="vs-step-mobile"
          style={{ display: "none", alignItems: "center", justifyContent: "space-between", gap: 12 }}
        >
          {(() => {
            const current = steps.find((s) => s.state === "current") ?? steps[0];
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "#F2B01E",
                      color: "#1A1916",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {current.n}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "#9A9486",
                        textTransform: "uppercase",
                      }}
                    >
                      Step {current.n} of {steps.length}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>
                      {current.label}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {steps.map((s) => (
                    <span
                      key={s.n}
                      style={{
                        width: s.state === "current" ? 18 : 7,
                        height: 7,
                        borderRadius: 99,
                        background:
                          s.state === "current"
                            ? "#F2B01E"
                            : s.state === "complete"
                              ? "#1A1916"
                              : "#DAD3C4",
                        transition: "all 0.2s",
                      }}
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .vs-step-desktop { display: none !important; }
          .vs-step-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
