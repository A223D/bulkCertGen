import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Vercel Web Analytics is the first thing on the site that reports anything
 * about a visitor to a third party, so two invariants have to hold together:
 *
 *   1. if the script is mounted, the privacy page has to say so — the same rule
 *      the 7-day output-archive window follows, where the copy is the promise;
 *   2. nothing may call `track()`, because custom events are a paid Vercel
 *      feature. On Hobby the call compiles, ships, and silently records
 *      nothing, which is worse than not having it — it reads like measurement.
 *
 * These are source-level checks: `app/layout.tsx` pulls in `next/font/google`,
 * which only resolves inside Next's build, so the module cannot be imported
 * here.
 */

const repoRoot = join(__dirname, "..", "..");

function read(...segments: string[]): string {
  return readFileSync(join(repoRoot, ...segments), "utf8");
}

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(path, found);
    } else if (/\.tsx?$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

const layout = read("app", "layout.tsx");

/**
 * Prose in JSX is wrapped across source lines, so copy assertions run against a
 * whitespace-collapsed copy — reformatting the file must not fail these.
 */
const privacyCopy = read("app", "legal", "privacy", "page.tsx")
  .replace(/<\/?strong>/g, "")
  .replace(/\s+/g, " ");

describe("analytics mounting", () => {
  it("mounts page-view analytics once, at the root layout", () => {
    expect(layout).toContain('from "@vercel/analytics/next"');
    expect(layout.match(/<Analytics\s*\/>/g)).toHaveLength(1);
  });

  it("does not use custom events, which Hobby silently drops", () => {
    const offenders = ["app", "components", "lib"]
      .flatMap((dir) => sourceFiles(dir))
      .filter((file) =>
        // Matches the import rather than a bare `track(` call, so prose in a
        // comment explaining why we don't use it is not itself a violation.
        /import\s*{[^}]*\btrack\b[^}]*}\s*from\s*["']@vercel\/analytics/.test(
          read(file),
        ),
      );

    expect(offenders).toEqual([]);
  });
});

describe("analytics disclosure", () => {
  it("discloses the analytics on the privacy page whenever it is mounted", () => {
    expect(layout).toContain("<Analytics />");
    expect(privacyCopy).toContain("Vercel Web Analytics");
  });

  it("states what is and is not collected", () => {
    // Each of these is a claim a visitor could hold us to; they mirror Vercel's
    // documented data points rather than a vague "we use analytics" line.
    for (const claim of [
      "no cookies",
      "approximate location",
      "device type",
      "discarded",
      "24 hours",
    ]) {
      expect(privacyCopy).toContain(claim);
    }
  });

  it("keeps the promise that uploads and output are never sent to analytics", () => {
    expect(privacyCopy).toContain("never sent to it");
    expect(privacyCopy).toContain("never used for analytics");
  });
});
