import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createPdfZip, createPdfZipStream } from "../../lib/batch-pdf/zip.ts";

async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

describe("PDF ZIP utility", () => {
  it("rejects empty file list", async () => {
    await expect(createPdfZip([])).rejects.toThrow(/at least one PDF/);
  });

  it("creates a ZIP with expected PDF files", async () => {
    const zipBytes = await createPdfZip([
      { filename: "001-test.pdf", bytes: new Uint8Array([1, 2, 3]) },
      { filename: "002-test.pdf", bytes: new Uint8Array([4, 5, 6]) },
    ]);
    const zip = await JSZip.loadAsync(zipBytes);
    const filenames = Object.keys(zip.files);

    expect(filenames).toEqual(["001-test.pdf", "002-test.pdf"]);
    expect(filenames.every((filename) => filename.endsWith(".pdf"))).toBe(true);
  });
});

describe("streaming PDF ZIP utility", () => {
  it("streams a ZIP containing every appended file", async () => {
    const stream = createPdfZipStream(async (append) => {
      append("001-test.pdf", new Uint8Array([1, 2, 3]));
      append("002-test.pdf", new Uint8Array([4, 5, 6]));
      append("report.csv", new TextEncoder().encode("a,b\n1,2\n"));
    });

    const zipBytes = await streamToBytes(stream);
    const zip = await JSZip.loadAsync(zipBytes);
    const filenames = Object.keys(zip.files).sort();

    expect(filenames).toEqual(["001-test.pdf", "002-test.pdf", "report.csv"]);

    const first = await zip.files["001-test.pdf"].async("uint8array");
    expect(Array.from(first)).toEqual([1, 2, 3]);
    const csv = await zip.files["report.csv"].async("string");
    expect(csv).toBe("a,b\n1,2\n");
  });

  it("supports asynchronous producers", async () => {
    const stream = createPdfZipStream(async (append) => {
      for (let i = 1; i <= 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        append(`${i}.pdf`, new Uint8Array([i]));
      }
    });

    const zip = await JSZip.loadAsync(await streamToBytes(stream));
    expect(Object.keys(zip.files).sort()).toEqual(["1.pdf", "2.pdf", "3.pdf"]);
  });
});
