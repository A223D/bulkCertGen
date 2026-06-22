import { AlertTriangle, CheckCircle2, Ruler, XCircle } from "lucide-react";
import type { ComponentType } from "react";
import type { CustomDesignPreflightResult } from "@/lib/batch-pdf/custom/preflight";

type Props = {
  result: CustomDesignPreflightResult;
};

type StatusKey = CustomDesignPreflightResult["status"];

const STATUS_MESSAGES: Record<StatusKey, string> = {
  ready: "Text fits.",
  readyWithWarnings: "Some text may be adjusted, but you can still export.",
  blocked: "Some text does not fit yet. Fix it before exporting.",
  needsOutputSize: "Choose the finished size so text fit can be checked.",
};

// Banner styling per status: tinted surface, border, and an icon.
const STATUS_BANNER: Record<StatusKey, string> = {
  ready: "border-success-line bg-success-soft text-success",
  readyWithWarnings: "border-warning-line bg-warning-soft text-warning",
  blocked: "border-danger-line bg-danger-soft text-danger",
  needsOutputSize: "border-warning-line bg-warning-soft text-warning",
};

const STATUS_ICON: Record<StatusKey, ComponentType<{ className?: string }>> = {
  ready: CheckCircle2,
  readyWithWarnings: AlertTriangle,
  blocked: XCircle,
  needsOutputSize: Ruler,
};

export function PreflightSummary({ result }: Props) {
  const { summary, status } = result;
  const Icon = STATUS_ICON[status];

  return (
    <div className="space-y-3">
      <div
        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${STATUS_BANNER[status]}`}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm font-semibold leading-5">{STATUS_MESSAGES[status]}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-muted px-2 py-2">
          <p className="text-lg font-semibold leading-6 text-ink">{summary.rowCount}</p>
          <p className="text-xs text-muted-foreground">rows</p>
        </div>
        <div
          className={`rounded-lg px-2 py-2 ${
            summary.warningCount > 0 ? "bg-warning-soft" : "bg-muted"
          }`}
        >
          <p
            className={`text-lg font-semibold leading-6 ${
              summary.warningCount > 0 ? "text-warning" : "text-ink"
            }`}
          >
            {summary.warningCount}
          </p>
          <p className="text-xs text-muted-foreground">warnings</p>
        </div>
        <div
          className={`rounded-lg px-2 py-2 ${
            summary.errorCount > 0 ? "bg-danger-soft" : "bg-muted"
          }`}
        >
          <p
            className={`text-lg font-semibold leading-6 ${
              summary.errorCount > 0 ? "text-danger" : "text-ink"
            }`}
          >
            {summary.errorCount}
          </p>
          <p className="text-xs text-muted-foreground">errors</p>
        </div>
      </div>
      {summary.warningCount > 0 && summary.errorCount === 0 ? (
        <p className="text-xs text-muted-foreground">
          {summary.warningCount} value{summary.warningCount !== 1 ? "s" : ""} will be adjusted
          (shrunk, wrapped, or truncated).
        </p>
      ) : null}
    </div>
  );
}
