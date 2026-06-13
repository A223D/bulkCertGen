import type { PreflightIssue } from "@/lib/batch-pdf/custom/preflight";

type Props = {
  issues: PreflightIssue[];
  hiddenCount: number;
};

const SEVERITY_LABEL: Record<PreflightIssue["severity"], string> = {
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const SEVERITY_STYLE: Record<PreflightIssue["severity"], string> = {
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
};

const SEVERITY_ORDER: Record<PreflightIssue["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

const GUIDANCE: Record<PreflightIssue["code"], string> = {
  missing_required_value: "Supply a value for this column or uncheck the Required flag.",
  text_overflow:
    "Enlarge the box, reduce the font size, or switch to Shrink to fit, Wrap, or Truncate.",
  text_truncated: "Acceptable if truncation is intended; enlarge the box to show the full value.",
  text_shrunk: "Text will be scaled down automatically.",
  text_wrapped: "Text will flow onto multiple lines.",
  invalid_field_box: "Remove or fix the invalid field box.",
  needs_output_size: "Set a custom item width and height in export options.",
};

export function PreflightIssueList({ issues, hiddenCount }: Props) {
  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Issues ({issues.length + hiddenCount})
      </p>
      <ul className="space-y-2">
        {sorted.map((issue, index) => (
          <li
            key={`${issue.code}-${issue.rowIndex ?? "x"}-${issue.fieldBoxId ?? "x"}-${index}`}
            className="rounded-md border border-line bg-panel p-3 text-sm"
          >
            <div className="flex items-start gap-2">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[issue.severity]}`}
              >
                {SEVERITY_LABEL[issue.severity]}
              </span>
              <span className="text-ink">{issue.message}</span>
            </div>
            <p className="mt-1 pl-0 text-xs text-muted-foreground">{GUIDANCE[issue.code]}</p>
            {issue.valueLength !== undefined && issue.valueLength > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Value length: {issue.valueLength} characters
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {hiddenCount} more issue{hiddenCount !== 1 ? "s" : ""} not shown. Resolve visible issues
          first.
        </p>
      ) : null}
    </div>
  );
}
