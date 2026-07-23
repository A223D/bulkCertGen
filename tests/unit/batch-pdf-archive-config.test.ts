import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ARCHIVE_DEFAULTS,
  getArchiveConfig,
} from "@/lib/batch-pdf/archive/config";

/**
 * Validation coverage for the archive's environment configuration.
 *
 * Two properties matter most here: misconfiguration must disable the feature
 * rather than throw (a bad env var must never break an export), and the remote
 * directory must never resolve to somewhere web-servable.
 */

const ARCHIVE_ENV_VARS = [
  "OUTPUT_ARCHIVE_ENABLED",
  "NIXIHOST_FTPS_HOST",
  "NIXIHOST_FTPS_USER",
  "NIXIHOST_FTPS_PASSWORD",
  "NIXIHOST_FTPS_VERIFY_CERTIFICATE",
  "NIXIHOST_OUTPUT_DIR",
  "OUTPUT_ARCHIVE_RETENTION_DAYS",
  "OUTPUT_ARCHIVE_TOTAL_CAP_BYTES",
  "OUTPUT_ARCHIVE_MAX_FILE_BYTES",
] as const;

function setEnv(values: Partial<Record<(typeof ARCHIVE_ENV_VARS)[number], string>>) {
  for (const name of ARCHIVE_ENV_VARS) {
    vi.stubEnv(name, values[name] ?? undefined);
  }
}

/** The minimum needed for the feature to switch on. */
function withCredentials(
  extra: Partial<Record<(typeof ARCHIVE_ENV_VARS)[number], string>> = {},
) {
  setEnv({
    NIXIHOST_FTPS_HOST: "ftp.example.test",
    NIXIHOST_FTPS_USER: "archive-user",
    NIXIHOST_FTPS_PASSWORD: "s3cret",
    ...extra,
  });
}

beforeEach(() => {
  // Start every case from a known-empty environment so ambient values in a
  // developer's shell cannot make these pass or fail spuriously.
  setEnv({});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getArchiveConfig credentials", () => {
  it("is disabled when no credentials are present", () => {
    expect(getArchiveConfig()).toBeNull();
  });

  it.each([
    ["host", "NIXIHOST_FTPS_HOST"],
    ["user", "NIXIHOST_FTPS_USER"],
    ["password", "NIXIHOST_FTPS_PASSWORD"],
  ] as const)("is disabled when the %s is missing", (_label, missing) => {
    withCredentials();
    vi.stubEnv(missing, undefined);

    expect(getArchiveConfig()).toBeNull();
  });

  it("is disabled when a credential is blank or whitespace", () => {
    withCredentials({ NIXIHOST_FTPS_HOST: "   " });
    expect(getArchiveConfig()).toBeNull();
  });

  it("trims surrounding whitespace from host and user", () => {
    withCredentials({
      NIXIHOST_FTPS_HOST: "  ftp.example.test  ",
      NIXIHOST_FTPS_USER: "  archive-user  ",
    });

    const config = getArchiveConfig();
    expect(config?.host).toBe("ftp.example.test");
    expect(config?.user).toBe("archive-user");
  });

  it("honours the kill switch even with valid credentials", () => {
    withCredentials({ OUTPUT_ARCHIVE_ENABLED: "false" });
    expect(getArchiveConfig()).toBeNull();
  });

  it("only treats the exact string 'false' as a kill switch", () => {
    withCredentials({ OUTPUT_ARCHIVE_ENABLED: "0" });
    expect(getArchiveConfig()).not.toBeNull();
  });
});

describe("getArchiveConfig remote directory", () => {
  it("defaults to the documented private folder", () => {
    withCredentials();
    expect(getArchiveConfig()?.remoteDir).toBe("/bulkCertGenOutputs");
  });

  it("normalizes a trailing slash", () => {
    withCredentials({ NIXIHOST_OUTPUT_DIR: "/private/outputs/" });
    expect(getArchiveConfig()?.remoteDir).toBe("/private/outputs");
  });

  it.each([
    ["a relative path", "bulkCertGenOutputs"],
    ["a traversing path", "/outputs/../../etc"],
    ["a public_html path", "/home/me/public_html/outputs"],
    ["a /www/ path", "/home/me/www/outputs"],
    ["a /public/ path", "/srv/public/outputs"],
    ["an embedded newline", "/outputs\n/evil"],
  ] as const)("disables the feature for %s", (_label, dir) => {
    withCredentials({ NIXIHOST_OUTPUT_DIR: dir });
    // Refusing to run beats silently writing other people's documents
    // somewhere the web server can hand them out.
    expect(getArchiveConfig()).toBeNull();
  });

  it("falls back to the default when the value is only whitespace", () => {
    withCredentials({ NIXIHOST_OUTPUT_DIR: "   " });
    expect(getArchiveConfig()?.remoteDir).toBe("/bulkCertGenOutputs");
  });
});

describe("getArchiveConfig certificate verification", () => {
  it("verifies certificates by default", () => {
    withCredentials();
    expect(getArchiveConfig()?.verifyCertificate).toBe(true);
  });

  it("opts out only for the exact string 'false'", () => {
    withCredentials({ NIXIHOST_FTPS_VERIFY_CERTIFICATE: "false" });
    expect(getArchiveConfig()?.verifyCertificate).toBe(false);

    // Anything else must fail safe towards verification.
    for (const value of ["FALSE", "no", "0", "", "true"]) {
      withCredentials({ NIXIHOST_FTPS_VERIFY_CERTIFICATE: value });
      expect(getArchiveConfig()?.verifyCertificate).toBe(true);
    }
  });
});

describe("getArchiveConfig limits", () => {
  it("applies the documented defaults", () => {
    withCredentials();
    const config = getArchiveConfig();

    expect(config?.retentionDays).toBe(7);
    expect(config?.totalCapBytes).toBe(5 * 1024 ** 3);
    expect(config?.maxArchiveBytes).toBe(256 * 1024 * 1024);
    expect(config?.partialMaxAgeMs).toBe(ARCHIVE_DEFAULTS.partialMaxAgeMs);
  });

  it("reads overrides from the environment", () => {
    withCredentials({
      OUTPUT_ARCHIVE_RETENTION_DAYS: "3",
      OUTPUT_ARCHIVE_TOTAL_CAP_BYTES: "1000000",
      OUTPUT_ARCHIVE_MAX_FILE_BYTES: "500000",
    });

    const config = getArchiveConfig();
    expect(config?.retentionDays).toBe(3);
    expect(config?.totalCapBytes).toBe(1_000_000);
    expect(config?.maxArchiveBytes).toBe(500_000);
  });

  it.each(["0", "-5", "abc", "1.5.2", "7.5", "1e3", " ", "", "0x10"])(
    "ignores the invalid override %o and keeps the default",
    (value) => {
      withCredentials({ OUTPUT_ARCHIVE_RETENTION_DAYS: value });
      // A malformed value must not silently reinterpret the retention window;
      // the 7-day figure is stated to users on the privacy page.
      expect(getArchiveConfig()?.retentionDays).toBe(7);
    },
  );

  it("accepts a padded but otherwise valid integer", () => {
    withCredentials({ OUTPUT_ARCHIVE_RETENTION_DAYS: " 14 " });
    expect(getArchiveConfig()?.retentionDays).toBe(14);
  });

  it("clamps the per-file ceiling to the folder cap", () => {
    withCredentials({
      OUTPUT_ARCHIVE_TOTAL_CAP_BYTES: "1000",
      OUTPUT_ARCHIVE_MAX_FILE_BYTES: "999999",
    });

    // A single file may never be allowed to exceed the whole folder budget,
    // otherwise every upload would evict everything and still be refused.
    expect(getArchiveConfig()?.maxArchiveBytes).toBe(1000);
  });

  it("never throws on hostile input", () => {
    withCredentials({
      OUTPUT_ARCHIVE_RETENTION_DAYS: "NaN",
      OUTPUT_ARCHIVE_TOTAL_CAP_BYTES: "Infinity",
      OUTPUT_ARCHIVE_MAX_FILE_BYTES: "1e999",
    });

    expect(() => getArchiveConfig()).not.toThrow();
    const config = getArchiveConfig();
    expect(config?.retentionDays).toBe(7);
    expect(config?.totalCapBytes).toBe(5 * 1024 ** 3);
    // "1e999" must not become a 1-byte ceiling that skips every upload.
    expect(config?.maxArchiveBytes).toBe(256 * 1024 * 1024);
  });
});
