/**
 * Nightly backstop for the FTPS output archive.
 *
 * The export route prunes on every upload, so this script is not the primary
 * enforcement path. It exists because that path only runs when someone exports:
 * if the site is quiet for a week, or uploads have been failing, nothing would
 * otherwise delete expired files. Running the same planner on a schedule means
 * the retention window and size cap hold regardless of traffic.
 *
 * Run with:  npx tsx scripts/prune-output-archive.ts
 */

import { getArchiveConfig } from "../lib/batch-pdf/archive/config";
import { pruneArchive } from "../lib/batch-pdf/archive/ftp-transport";

async function main(): Promise<void> {
  const config = getArchiveConfig();

  if (!config) {
    console.error(
      "Output archive is not configured. Set NIXIHOST_FTPS_HOST, " +
        "NIXIHOST_FTPS_USER, NIXIHOST_FTPS_PASSWORD, and (optionally) " +
        "NIXIHOST_OUTPUT_DIR.",
    );
    process.exit(1);
  }

  console.log(
    `Pruning ${config.remoteDir} — keep ${config.retentionDays} days, ` +
      `cap ${(config.totalCapBytes / 1024 ** 3).toFixed(2)} GB`,
  );

  const result = await pruneArchive(config);

  if (result.status === "failed") {
    console.error(`Prune failed: ${result.reason}`);
    process.exit(1);
  }

  const { plan, deleted } = result;
  console.log(
    `Deleted ${deleted} file(s): ${plan.expiredCount} expired, ` +
      `${plan.evictedCount} evicted for size, ${plan.partialCount} abandoned upload(s).`,
  );
  console.log(
    `Retained ${(plan.retainedBytes / 1024 ** 3).toFixed(3)} GB ` +
      `of ${(config.totalCapBytes / 1024 ** 3).toFixed(2)} GB.`,
  );

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(
      summaryPath,
      [
        "### Output archive prune",
        "",
        `- Folder: \`${config.remoteDir}\``,
        `- Deleted: ${deleted} (expired ${plan.expiredCount}, evicted ${plan.evictedCount}, partial ${plan.partialCount})`,
        `- Retained: ${(plan.retainedBytes / 1024 ** 3).toFixed(3)} GB of ${(config.totalCapBytes / 1024 ** 3).toFixed(2)} GB`,
        "",
      ].join("\n"),
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
