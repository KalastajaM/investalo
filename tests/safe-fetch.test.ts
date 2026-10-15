import { describe, it, expect } from "vitest";
import { isPublicAddress, assertFetchableUrl, safeFetch, UnsafeUrlError } from "../server/safe-fetch";

// ---------------------------------------------------------------------------
// isPublicAddress
// ---------------------------------------------------------------------------

describe("isPublicAddress", () => {
  it.each([
    "127.0.0.1", "127.1.2.3", "10.0.0.5", "172.16.0.1", "172.31.255.255", "192.168.1.1",
    "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1",
    "::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1",
  ])("rejects non-public address %s", (addr) => {
    expect(isPublicAddress(addr)).toBe(false);
  });

  it.each(["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700::1111", "::ffff:8.8.8.8"])(
    "accepts public address %s",
    (addr) => {
      expect(isPublicAddress(addr)).toBe(true);
    },
  );

  it("rejects strings that are not IP addresses", () => {
    expect(isPublicAddress("example.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assertFetchableUrl
// ---------------------------------------------------------------------------

describe("assertFetchableUrl", () => {
  it("accepts public http(s) URLs", () => {
    expect(assertFetchableUrl("https://www.oikotie.fi/myytavat-asunnot/1").hostname).toBe("www.oikotie.fi");
  });

  it.each([
    "ftp://example.com/file",
    "file:///etc/passwd",
    "not a url",
    "http://localhost:5000/",
    "http://app.localhost/",
    "http://intranet/",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://[::ffff:7f00:1]/",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/", // decimal form of 127.0.0.1, normalised by URL()
  ])("rejects %s", (url) => {
    expect(() => assertFetchableUrl(url)).toThrow(UnsafeUrlError);
  });
});

// ---------------------------------------------------------------------------
// safeFetch
// ---------------------------------------------------------------------------

describe("safeFetch", () => {
  it("rejects a literal private IP without connecting", async () => {
    await expect(safeFetch("http://127.0.0.1:1/")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("carries HTTP status 400 for the error handler", async () => {
    await expect(safeFetch("http://10.0.0.1/")).rejects.toMatchObject({ status: 400 });
  });
});
