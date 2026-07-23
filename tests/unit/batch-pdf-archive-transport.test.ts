import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Orchestration coverage for the FTPS transport, against a fake `basic-ftp`
 * client. These assertions describe behaviour that only shows up against a
 * live server, where getting it wrong means either leaking storage or
 * publishing a truncated archive:
 *
 *   - pruning happens before the upload, never after;
 *   - bytes land under a `.part` name and are renamed on success only;
 *   - a failed upload cleans up after itself;
 *   - nothing ever throws out of the transport, and the socket is always
 *     closed.
 */

type UploadBehaviour = "ok" | "throw";

type FakeListing = Array<{
  name: string;
  size: number;
  modifiedAt?: Date;
  isFile?: boolean;
}>;

const state = {
  calls: [] as Array<{ op: string; args: unknown[] }>,
  listing: [] as FakeListing,
  listThrows: false,
  accessThrows: false,
  uploadBehaviour: "ok" as UploadBehaviour,
  uploadHangs: false,
  renameThrows: false,
  removeThrows: false,
  closed: 0,
  accessOptions: null as Record<string, unknown> | null,
  timeouts: [] as number[],
};

function record(op: string, ...args: unknown[]) {
  state.calls.push({ op, args });
}

function ops(): string[] {
  return state.calls.map((call) => call.op);
}

function argsFor(op: string): unknown[][] {
  return state.calls.filter((call) => call.op === op).map((call) => call.args);
}

vi.mock("basic-ftp", () => {
  class FakeClient {
    ftp = { verbose: false };

    constructor(timeout?: number) {
      state.timeouts.push(timeout ?? -1);
    }

    async access(options: Record<string, unknown>) {
      state.accessOptions = options;
      record("access");
      if (state.accessThrows) throw new Error("530 Login incorrect");
    }

    async ensureDir(path: string) {
      record("ensureDir", path);
    }

    async list(path: string) {
      record("list", path);
      if (state.listThrows) throw new Error("550 Failed to open directory");
      return state.listing.map((entry) => ({
        name: entry.name,
        size: entry.size,
        modifiedAt: entry.modifiedAt,
        isFile: entry.isFile ?? true,
        isDirectory: false,
      }));
    }

    async uploadFrom(source: unknown, remotePath: string) {
      record("uploadFrom", typeof source === "string" ? "path" : "stream", remotePath);
      if (state.uploadHangs) {
        await new Promise(() => {});
      }
      if (state.uploadBehaviour === "throw") {
        throw new Error("426 Transfer aborted");
      }
    }

    async rename(from: string, to: string) {
      record("rename", from, to);
      if (state.renameThrows) throw new Error("550 Rename failed");
    }

    async remove(path: string) {
      record("remove", path);
      if (state.removeThrows) throw new Error("550 Delete failed");
    }

    close() {
      state.closed += 1;
    }
  }

  return { Client: FakeClient };
});

import { pruneArchive, uploadArchive } from "@/lib/batch-pdf/archive/ftp-transport";
import { makeArchiveFilename } from "@/lib/batch-pdf/archive/naming";
import { ARCHIVE_DEFAULTS, type ArchiveConfig } from "@/lib/batch-pdf/archive/config";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 6, 23, 12, 0, 0);
const MB = 1024 * 1024;
const GB = 1024 * MB;

function config(overrides: Partial<ArchiveConfig> = {}): ArchiveConfig {
  return {
    host: "ftp.example.test",
    user: "archive-user",
    password: "s3cret",
    verifyCertificate: true,
    remoteDir: "/bulkCertGenOutputs",
    retentionDays: 7,
    totalCapBytes: 5 * GB,
    maxArchiveBytes: 200 * MB,
    operationTimeoutMs: ARCHIVE_DEFAULTS.operationTimeoutMs,
    totalTimeoutMs: 500,
    partialMaxAgeMs: ARCHIVE_DEFAULTS.partialMaxAgeMs,
    ...overrides,
  };
}

function bytes(size: number) {
  return { kind: "bytes" as const, bytes: new Uint8Array(size) };
}

beforeEach(() => {
  state.calls = [];
  state.listing = [];
  state.listThrows = false;
  state.accessThrows = false;
  state.uploadBehaviour = "ok";
  state.uploadHangs = false;
  state.renameThrows = false;
  state.removeThrows = false;
  state.closed = 0;
  state.accessOptions = null;
  state.timeouts = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadArchive connection", () => {
  it("uses explicit FTPS on port 21 with certificate verification", async () => {
    await uploadArchive(config(), bytes(1024), NOW);

    expect(state.accessOptions).toMatchObject({
      host: "ftp.example.test",
      port: 21,
      user: "archive-user",
      password: "s3cret",
      secure: true,
    });
    expect(state.accessOptions?.secureOptions).toMatchObject({
      rejectUnauthorized: true,
      servername: "ftp.example.test",
    });
  });

  it("passes the opt-out through to TLS verification", async () => {
    await uploadArchive(config({ verifyCertificate: false }), bytes(1024), NOW);

    expect(state.accessOptions?.secureOptions).toMatchObject({
      rejectUnauthorized: false,
    });
  });

  it("always closes the connection, including on failure", async () => {
    await uploadArchive(config(), bytes(1024), NOW);
    expect(state.closed).toBe(1);

    state.accessThrows = true;
    await uploadArchive(config(), bytes(1024), NOW);
    expect(state.closed).toBe(2);
  });
});

describe("uploadArchive happy path", () => {
  it("uploads under a .part name and renames it into place", async () => {
    const result = await uploadArchive(config(), bytes(4096), NOW);

    expect(result.status).toBe("uploaded");
    if (result.status !== "uploaded") throw new Error("expected an upload");

    const [uploadArgs] = argsFor("uploadFrom");
    const [renameArgs] = argsFor("rename");
    const finalPath = `/bulkCertGenOutputs/${result.filename}`;

    expect(uploadArgs[1]).toBe(`${finalPath}.part`);
    expect(renameArgs).toEqual([`${finalPath}.part`, finalPath]);
    // The rename is what makes an interrupted transfer harmless, so it must
    // come after the bytes, never before.
    expect(ops().indexOf("uploadFrom")).toBeLessThan(ops().indexOf("rename"));
  });

  it("streams from disk when handed a spooled file", async () => {
    await uploadArchive(
      config(),
      { kind: "file", path: "/tmp/spooled.zip", sizeBytes: 2048 },
      NOW,
    );

    expect(argsFor("uploadFrom")[0][0]).toBe("path");
  });

  it("ensures the remote folder exists before listing it", async () => {
    await uploadArchive(config(), bytes(1024), NOW);

    const order = ops();
    expect(order.indexOf("ensureDir")).toBeLessThan(order.indexOf("list"));
    expect(argsFor("ensureDir")[0][0]).toBe("/bulkCertGenOutputs");
  });

  it("reports the byte count it uploaded", async () => {
    const result = await uploadArchive(config(), bytes(4096), NOW);
    expect(result).toMatchObject({ status: "uploaded", sizeBytes: 4096 });
  });
});

describe("uploadArchive pruning", () => {
  it("deletes expired archives before uploading the new one", async () => {
    const stale = makeArchiveFilename(NOW - 9 * DAY_MS);
    const fresh = makeArchiveFilename(NOW - 1 * DAY_MS);
    state.listing = [
      { name: stale, size: 10 * MB },
      { name: fresh, size: 10 * MB },
    ];

    const result = await uploadArchive(config(), bytes(1024), NOW);

    expect(argsFor("remove").map((args) => args[0])).toEqual([
      `/bulkCertGenOutputs/${stale}`,
    ]);
    // Freeing space before the transfer is what keeps the folder under its cap
    // at all times, rather than briefly overshooting it.
    expect(ops().indexOf("remove")).toBeLessThan(ops().indexOf("uploadFrom"));
    expect(result).toMatchObject({ status: "uploaded" });
  });

  it("never deletes files it did not write", async () => {
    state.listing = [
      { name: "someone-elses-backup.zip", size: 10 * MB },
      { name: "reminders-prod-daily-2026-01-01-0337.tar.gz.gpg", size: 10 * MB },
    ];

    await uploadArchive(config(), bytes(1024), NOW);

    expect(argsFor("remove")).toEqual([]);
  });

  it("skips the upload when the cap cannot fit it, but still prunes", async () => {
    const stale = makeArchiveFilename(NOW - 9 * DAY_MS);
    state.listing = [
      { name: stale, size: 1 * MB },
      { name: "immovable-foreign-blob.bin", size: 5 * GB },
    ];

    const result = await uploadArchive(config(), bytes(10 * MB), NOW);

    expect(result).toMatchObject({
      status: "skipped",
      reason: "foreign_files_exceed_cap",
    });
    expect(argsFor("remove").map((args) => args[0])).toEqual([
      `/bulkCertGenOutputs/${stale}`,
    ]);
    expect(ops()).not.toContain("uploadFrom");
  });

  it("keeps pruning when one delete fails", async () => {
    state.removeThrows = true;
    state.listing = [
      { name: makeArchiveFilename(NOW - 9 * DAY_MS), size: MB },
      { name: makeArchiveFilename(NOW - 10 * DAY_MS), size: MB },
    ];

    const result = await uploadArchive(config(), bytes(1024), NOW);

    expect(argsFor("remove")).toHaveLength(2);
    expect(result).toMatchObject({ status: "uploaded" });
  });

  it("still uploads when the folder listing fails", async () => {
    state.listThrows = true;

    const result = await uploadArchive(config(), bytes(1024), NOW);

    // Losing one pruning pass is recoverable; refusing to archive is not.
    expect(result).toMatchObject({ status: "uploaded" });
    expect(ops()).toContain("uploadFrom");
  });
});

describe("uploadArchive rejections", () => {
  it("skips an empty archive without connecting", async () => {
    const result = await uploadArchive(config(), bytes(0), NOW);

    expect(result).toMatchObject({ status: "skipped", reason: "empty_archive" });
    expect(state.calls).toEqual([]);
  });

  it("skips an oversized archive without connecting", async () => {
    const result = await uploadArchive(
      config({ maxArchiveBytes: 1024 }),
      bytes(2048),
      NOW,
    );

    expect(result).toMatchObject({
      status: "skipped",
      reason: "exceeds_max_file_bytes",
    });
    expect(state.calls).toEqual([]);
  });
});

describe("uploadArchive failure handling", () => {
  it("removes the .part file when the transfer fails", async () => {
    state.uploadBehaviour = "throw";

    const result = await uploadArchive(config(), bytes(1024), NOW);

    expect(result.status).toBe("failed");
    const removed = argsFor("remove").map((args) => String(args[0]));
    expect(removed).toHaveLength(1);
    expect(removed[0].endsWith(".part")).toBe(true);
    expect(ops()).not.toContain("rename");
  });

  it("removes the .part file when the rename fails", async () => {
    state.renameThrows = true;

    const result = await uploadArchive(config(), bytes(1024), NOW);

    expect(result.status).toBe("failed");
    // A half-finished upload must never be left behind under a name the
    // pruner would treat as a complete archive.
    expect(argsFor("remove").map((args) => String(args[0]))[0]).toMatch(/\.part$/);
  });

  it("resolves rather than throws when the server rejects the login", async () => {
    state.accessThrows = true;

    const result = await uploadArchive(config(), bytes(1024), NOW);

    expect(result.status).toBe("failed");
    if (result.status !== "failed") throw new Error("expected a failure");
    expect(result.reason).toContain("530");
  });

  it("gives up rather than hanging when the server stalls", async () => {
    // A silently stalled socket is the worst case on a serverless runtime: it
    // would pin the invocation until the platform kills it.
    state.uploadHangs = true;

    const result = await uploadArchive(
      config({ totalTimeoutMs: 60 }),
      bytes(1024),
      NOW,
    );

    expect(result.status).toBe("failed");
    if (result.status !== "failed") throw new Error("expected a failure");
    expect(result.reason).toContain("timed out");
    expect(state.closed).toBe(1);
  });
});

describe("pruneArchive", () => {
  it("deletes expired archives and reports what it did", async () => {
    const stale = makeArchiveFilename(NOW - 9 * DAY_MS);
    const abandoned = `${makeArchiveFilename(NOW - 3 * DAY_MS)}.part`;
    const fresh = makeArchiveFilename(NOW - 1 * DAY_MS);
    state.listing = [
      { name: stale, size: 2 * MB },
      { name: abandoned, size: 1 * MB },
      { name: fresh, size: 3 * MB },
    ];

    const result = await pruneArchive(config(), NOW);

    expect(result.status).toBe("pruned");
    if (result.status !== "pruned") throw new Error("expected a prune");

    expect(result.deleted).toBe(2);
    expect(result.plan.expiredCount).toBe(1);
    expect(result.plan.partialCount).toBe(1);
    expect(result.plan.retainedBytes).toBe(3 * MB);
    expect(ops()).not.toContain("uploadFrom");
  });

  it("brings a folder that is already over the cap back under it", async () => {
    // Reachable by lowering the cap, or by concurrent uploads that each
    // planned against their own listing and jointly overshot.
    const oldest = makeArchiveFilename(NOW - 3 * DAY_MS);
    const newest = makeArchiveFilename(NOW - 1 * DAY_MS);
    state.listing = [
      { name: newest, size: 4 * GB },
      { name: oldest, size: 4 * GB },
    ];

    const result = await pruneArchive(config(), NOW);

    expect(result.status).toBe("pruned");
    if (result.status !== "pruned") throw new Error("expected a prune");

    expect(argsFor("remove").map((args) => args[0])).toEqual([
      `/bulkCertGenOutputs/${oldest}`,
    ]);
    expect(result.plan.retainedBytes).toBeLessThanOrEqual(5 * GB);
  });

  it("leaves a folder inside the cap untouched", async () => {
    state.listing = [{ name: makeArchiveFilename(NOW - DAY_MS), size: 2 * GB }];

    const result = await pruneArchive(config(), NOW);

    expect(result).toMatchObject({ status: "pruned", deleted: 0 });
  });

  it("resolves with a failure when the connection dies", async () => {
    state.accessThrows = true;

    const result = await pruneArchive(config(), NOW);

    expect(result.status).toBe("failed");
    expect(state.closed).toBe(1);
  });

  it("ignores directories in the listing", async () => {
    state.listing = [
      { name: "subfolder", size: 0, isFile: false },
      { name: makeArchiveFilename(NOW - 9 * DAY_MS), size: MB },
    ];

    const result = await pruneArchive(config(), NOW);

    expect(result).toMatchObject({ status: "pruned", deleted: 1 });
  });
});
