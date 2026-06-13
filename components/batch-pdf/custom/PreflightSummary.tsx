import type { CustomDesignPreflightResult } from "@/lib/batch-pdf/custom/preflight";

type Props = {
  result: CustomDesignPreflightResult;
};

const STATUS_MESSAGES: Record<CustomDesignPreflightResult["status"], string> = {
  ready: "All checked values fit with the current field settings.",
  readyWithWarnings: "Export would be allowed, but some values will be adjusted.",
  blocked: "Some values do not fit. Adjust boxes or overflow settings before exporting.",
  needsOutputSize:
    "Set a custom output size in export options so text fit can be checked for this image design.",
};

const STATUS_COLORS: Record<CustomDesignPreflightResult["status"], string> = {
  ready: "text-green-700 dark:text-green-400",
  readyWithWarnings: "text-amber-700 dark:text-amber-400",
  blocked: "text-red-700 dark:text-red-400",
  needsOutputSize: "text-amber-700 dark:text-amber-400",
};

export function PreflightSummary({ result }: Props) {
  const { summary, status } = result;

  return (
    <div className="space-y-3">
      <p className={`text-sm font-medium leading-5 ${STATUS_COLORS[status]}`}>
        {STATUS_MESSAGES[status]}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md bg-muted px-2 py-2">
          <p className="text-lg font-semibold leading-6">{summary.rowCount}</p>
          <p className="text-xs text-muted-foreground">rows</p>
        </div>
        <div className="rounded-md bg-muted px-2 py-2">
          <p className="text-lg font-semibold leading-6">{summary.checkedCellCount}</p>
          <p className="text-xs text-muted-foreground">values checked</p>
        </div>
        <div className="rounded-md bg-muted px-2 py-2">
          <p
            className={`text-lg font-semibold leading-6 ${
              summary.errorCount > 0 ? "text-red-600 dark:text-red-400" : ""
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
