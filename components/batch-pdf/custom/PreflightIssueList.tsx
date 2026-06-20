import type { PreflightIssue } from "@/lib/batch-pdf/custom/preflight";

export type DisplayIssue = {
  issue: PreflightIssue;
  // Actual cell/static text for this issue. Resolved client-side only — never
  // sent to the server or logs — so the user can see exactly what does not fit.
  sampleText?: string;
};

type Props = {
  items: DisplayIssue[];
  hiddenCount: number;
};

const SEVERITY_LABEL: Record<PreflightIssue["severity"], string> = {
  error: "Needs a fix",
  warning: "Heads up",
  info: "Automatic",
};

const SEVERITY_STYLE: Record<PreflightIssue["severity"], string> = {
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
};

const SEVERITY_BORDER: Record<PreflightIssue["severity"], string> = {
  error: "border-red-200 dark:border-red-900/40",
  warning: "border-amber-200 dark:border-amber-900/40",
  info: "border-line",
};

const SEVERITY_ORDER: Record<PreflightIssue["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

const MAX_QUOTE = 70;

function quote(sampleText: string | undefined): string {
  const text = (sampleText ?? "").trim();
  if (!text) return "This field";
  const shown = text.length > MAX_QUOTE ? `${text.slice(0, MAX_QUOTE)}…` : text;
  return `“${shown}”`;
}

// Plain-language explanation of what is wrong, naming the actual text.
function explain(issue: PreflightIssue, sampleText?: string): string {
  switch (issue.code) {
    case "text_overflow":
      return `${quote(sampleText)} is too long to fit in this field.`;
    case "text_truncated":
      return `${quote(sampleText)} is too long, so it will be cut off with “…”.`;
    case "text_shrunk":
      return `${quote(sampleText)} will be made smaller so it fits.`;
    case "text_wrapped":
      return `${quote(sampleText)} will be split across more than one line.`;
    case "missing_required_value":
      return "This field has no value for this row.";
    case "needs_output_size":
      return "We need the finished size before we can check whether text fits.";
    case "invalid_field_box":
      return "This field box can’t be used as set up.";
  }
}

// What the user can do about it.
function fix(issue: PreflightIssue): string {
  switch (issue.code) {
    case "text_overflow":
      return "Try: make the box bigger by dragging a corner, tap “↓ Smaller” to lower the text size, or set this field to “Shrink to fit” under More text settings.";
    case "text_truncated":
      return "Okay if you meant to shorten it. To show all of it, make the box bigger or shorten the text in your spreadsheet.";
    case "text_shrunk":
      return "Happens automatically. Make the box bigger if you want the text to stay larger.";
    case "text_wrapped":
      return "Happens automatically. Make the box taller if any lines get cut off.";
    case "missing_required_value":
      return "Add a value for this row in your spreadsheet, or remove the field.";
    case "needs_output_size":
      return "Choose the finished size above.";
    case "invalid_field_box":
      return "Remove this field box and add it again.";
  }
}

function title(issue: PreflightIssue): string {
  const field = issue.fieldLabel ?? "Field";
  if (typeof issue.rowIndex === "number") {
    return `Row ${issue.rowIndex + 1} · ${field}`;
  }
  return field;
}

export function PreflightIssueList({ items, hiddenCount }: Props) {
  const sorted = [...items].sort(
    (a, b) => SEVERITY_ORDER[a.issue.severity] - SEVERITY_ORDER[b.issue.severity],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        What to check ({items.length + hiddenCount})
      </p>
      <ul className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
        {sorted.map(({ issue, sampleText }, index) => (
          <li
            key={`${issue.code}-${issue.rowIndex ?? "x"}-${issue.fieldBoxId ?? "x"}-${index}`}
            className={`rounded-lg border ${SEVERITY_BORDER[issue.severity]} bg-panel p-3 text-sm`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLE[issue.severity]}`}
              >
                {SEVERITY_LABEL[issue.severity]}
              </span>
              <span className="truncate font-semibold text-ink">{title(issue)}</span>
            </div>
            <p className="mt-1.5 leading-5 text-ink">{explain(issue, sampleText)}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{fix(issue)}</p>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {hiddenCount} more item{hiddenCount !== 1 ? "s" : ""} not shown. Fix the ones above first.
        </p>
      ) : null}
    </div>
  );
}
