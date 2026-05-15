// SSRF guard — resolves a URL/host and rejects targets that point at private,
// loopback, link-local, cloud-metadata, or otherwise reserved ranges. Applied
// to every user-supplied URL the server dials (monitors, webhooks, SSL/domain
// checks). Use `assertPublicUrl` before opening a connection.

import { promises as dns } from "node:dns";
import net from "node:net";

// Read the bypass flag lazily so tests (which set the env var before
// invoking the helper) and runtime config reloads both take effect.
const allowPrivate = () => process.env.ALLOW_PRIVATE_TARGETS === "1";

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

// IPv4 CIDR check; cidr like "10.0.0.0/8".
function ipv4InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const ipNum = ipv4ToInt(ip);
  const rangeNum = ipv4ToInt(range);
  if (ipNum == null || rangeNum == null) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (0xffffffff << (32 - bits)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    const v = Number(part);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

const BLOCKED_V4 = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10", // CGNAT
  "127.0.0.0/8",
  "169.254.0.0/16", // link-local + cloud metadata (169.254.169.254)
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4", // multicast
  "240.0.0.0/4", // reserved
  "255.255.255.255/32",
];

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return BLOCKED_V4.some((c) => ipv4InCidr(ip, c));
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    // unique-local fc00::/7 and link-local fe80::/10
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
    // IPv4-mapped — check the embedded v4 address
    const mapped = lower.match(/::ffff:([0-9.]+)$/);
    if (mapped && net.isIPv4(mapped[1])) return isBlockedIp(mapped[1]);
    // multicast ff00::/8
    if (lower.startsWith("ff")) return true;
  }
  return false;
}

// Resolve a hostname to all A/AAAA records and reject if any of them is a
// private/loopback/link-local/metadata address. Checking *all* records (not
// just the first) prevents DNS-rebinding-style multi-record attacks.
export async function assertPublicHost(host: string): Promise<void> {
  if (allowPrivate()) return;
  if (!host) throw new SsrfBlockedError("empty host");

  // Strip brackets from IPv6 literals
  const clean = host.replace(/^\[|\]$/g, "");

  // If the host is already an IP literal, check it directly.
  if (net.isIP(clean)) {
    if (isBlockedIp(clean)) {
      throw new SsrfBlockedError(`Target ${clean} is in a blocked range`);
    }
    return;
  }

  // Block obviously local hostnames before paying for DNS.
  const lower = clean.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower === "metadata.google.internal"
  ) {
    throw new SsrfBlockedError(`Hostname ${clean} is not allowed`);
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(clean, { all: true, verbatim: true });
  } catch {
    throw new SsrfBlockedError(`Could not resolve ${clean}`);
  }
  if (records.length === 0) {
    throw new SsrfBlockedError(`Could not resolve ${clean}`);
  }
  for (const r of records) {
    if (isBlockedIp(r.address)) {
      throw new SsrfBlockedError(
        `Hostname ${clean} resolves to blocked address ${r.address}`,
      );
    }
  }
}

export async function assertPublicUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SsrfBlockedError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfBlockedError(`Protocol ${parsed.protocol} not allowed`);
  }
  await assertPublicHost(parsed.hostname);
}
