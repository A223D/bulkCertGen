import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/api/generate-custom-pdf/route.ts";

describe("custom PDF route failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a support reference and logs only safe metadata for failed requests", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const formData = new FormData();
    formData.append("designFile", new File(["private"], "private-roster.csv", { type: "text/csv" }));
    formData.append("payload", "{}");

    const response = await POST(
      new Request("http://localhost/api/generate-custom-pdf", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/\(ref [0-9A-F]{8}\)$/);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const logged = String(errorSpy.mock.calls[0][0]);
    const event = JSON.parse(logged);

    expect(event).toMatchObject({
      evt: "custom_export_failed",
      code: "custom_design_unsupported_file",
      status: 400,
      fileSizeBucket: "0-1mb",
    });
    expect(event.errorId).toMatch(/^[0-9A-F]{8}$/);
    expect(typeof event.durationMs).toBe("number");
    expect(logged).not.toContain("private-roster.csv");
    expect(logged).not.toContain("private");
  });
});
