import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { BlockList, isIP } from "node:net";
import { Agent, fetch, type RequestInit, type Response } from "undici";
import { AppError } from "./errors";

/**
 * Fetching user-supplied URLs (listing import, market analysis) is an SSRF vector.
 * safeFetch only connects to public addresses:
 * - the address check runs inside the connection's DNS lookup, so a hostname cannot
 *   pass validation and then resolve to a private address (DNS rebinding)
 * - redirects are followed manually and every hop is re-validated
 */

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96],
] as const) blocked.addSubnet(net, prefix, "ipv6");

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return false;
  if (family === 6) {
    // IPv4-mapped IPv6 (::ffff:127.0.0.1) must be judged as IPv4
    const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicAddress(mapped[1]);
    return !blocked.check(address, "ipv6");
  }
  return !blocked.check(address, "ipv4");
}

/** A URL rejected by the SSRF policy; maps to HTTP 400. */
export class UnsafeUrlError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "UnsafeUrlError";
  }
}

const MAX_REDIRECTS = 5;

const agent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, "", 4);
        const list = addresses as LookupAddress[];
        const bad = list.find((a) => !isPublicAddress(a.address));
        if (bad || list.length === 0) {
          return callback(new UnsafeUrlError(`${hostname} resolves to a non-public address`), "", 4);
        }
        if ((options as { all?: boolean }).all) return (callback as any)(null, list);
        callback(null, list[0].address, list[0].family);
      });
    },
  },
});

/** Validates scheme and literal-IP hosts; hostnames are checked at connect time. */
export function assertFetchableUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http/https URLs are allowed");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new UnsafeUrlError("URL host is not allowed");
  if (host === "localhost" || host.endsWith(".localhost") || !host.includes(".") && !isIP(host)) {
    throw new UnsafeUrlError("URL host is not allowed");
  }
  return url;
}

export async function safeFetch(rawUrl: string, init: RequestInit = {}): Promise<Response> {
  let url = assertFetchableUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, redirect: "manual", dispatcher: agent });
    } catch (err) {
      // undici wraps connect errors; surface our own rejection unchanged
      const cause = (err as { cause?: unknown }).cause;
      if (cause instanceof UnsafeUrlError) throw cause;
      throw err;
    }
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return res;
    await res.body?.cancel();
    url = assertFetchableUrl(new URL(location, url).href);
  }
  throw new UnsafeUrlError("Too many redirects");
}
