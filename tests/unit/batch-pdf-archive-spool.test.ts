import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

import { createArchiveSpool } from "@/lib/batch-pdf/archive/capture";
import { ARCHIVE_DEFAULTS, type ArchiveConfig } from "@/lib/batch-pdf/archive/config";
import { createPdfZipStream } from "@/lib/batch-pdf/zip";

function testConfig(overrides: Partial<ArchiveConfig> = {}): ArchiveConfig {
  return {
    host: "ftp.example.test",
    user: "user",
    password: "password",
    verifyCertificate: true,
    remoteDir: "/bulkCertGenOutputs",
    retentionDays: 7,
    totalCapBytes: 5 * 1024 ** 3,
    maxArchiveBytes: 200 * 1024 * 1024,
    operationTimeoutMs: ARCHIVE_DEFAULTS.operationTimeoutMs,
    totalTimeoutMs: ARCHIVE_DEFAULTS.totalTimeoutMs,
    partialMaxAgeMs: ARCHIVE_DEFAULTS.partialMaxAgeMs,
    ...overrides,
  };
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function payload(name: string, sizeBytes: number): Uint8Array {
  const bytes = new Uint8Array(sizeBytes);
  // Vary the content so the ZIP does not compress to almost nothing, which
  // would defeat the size-ceiling assertions below.
  for (let index = 0; index < sizeBytes; index += 1) {
    bytes[index] = (index * 31 + name.charCodeAt(0)) % 251;
  }
  return bytes;
}

describe("streaming archive spool", () => {
  it("captures a byte-identical copy of the ZIP the user downloads", async () => {
    const spool = createArchiveSpool(testConfig());
    expect(spool).not.toBeNull();

    const stream = createPdfZipStream(
      async (append) => {
        append("one.pdf", payload("one.pdf", 2048));
        append("two.pdf", payload("two.pdf", 4096));
      },
      { tap: spool!.writable },
    );

    const downloaded = await drain(stream);
    const spooled = await spool!.done;

    expect(spooled).not.toBeNull();
    expect(spooled!.sizeBytes).toBe(downloaded.byteLength);

    const onDisk = await readFile(spooled!.path);
    expect(Buffer.from(downloaded).equals(onDisk)).toBe(true);

    // And the captured copy is a readable archive, not just matching bytes.
    const zip = await JSZip.loadAsync(onDisk);
    expect(Object.keys(zip.files).sort()).toEqual(["one.pdf", "two.pdf"]);
  });

  it("abandons the capture past the size ceiling without harming the download", async () => {
    const spool = createArchiveSpool(testConfig({ maxArchiveBytes: 1024 }));

    const stream = createPdfZipStream(
      async (append) => {
        for (let index = 0; index < 8; index += 1) {
          append(`row-${index}.pdf`, payload(`row-${index}.pdf`, 8192));
        }
      },
      { tap: spool!.writable },
    );

    const downloaded = await drain(stream);
    const spooled = await spool!.done;

    // Capture gave up...
    expect(spooled).toBeNull();
    // ...but the user still got a complete, valid archive.
    const zip = await JSZip.loadAsync(Buffer.from(downloaded));
    expect(Object.keys(zip.files)).toHaveLength(8);
  });

  it("does not retain a truncated archive when rendering fails mid-stream", async () => {
    const spool = createArchiveSpool(testConfig());

    const stream = createPdfZipStream(
      async (append) => {
        append("one.pdf", payload("one.pdf", 1024));
        throw new Error("render exploded");
      },
      { tap: spool!.writable },
    );

    await expect(drain(stream)).rejects.toThrow();
    await expect(spool!.done).resolves.toBeNull();
  });

  it("cleans up when aborted explicitly", async () => {
    const spool = createArchiveSpool(testConfig());
    spool!.abort();
    await expect(spool!.done).resolves.toBeNull();
  });

  it("leaves the ZIP untouched when no tap is supplied", async () => {
    const stream = createPdfZipStream(async (append) => {
      append("only.pdf", payload("only.pdf", 512));
    });

    const zip = await JSZip.loadAsync(Buffer.from(await drain(stream)));
    expect(Object.keys(zip.files)).toEqual(["only.pdf"]);
  });
});
