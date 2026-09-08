/**
 * Deriving monitor defaults from a URL.
 *
 * The point is to leave the monitor form with exactly one required field. The
 * name and the check type are guessed from the URL and stay editable. Pure
 * functions only, so they are testable and carry no UI dependency.
 */

/** Second-level TLDs, so "co.uk" never becomes the name. */
const MULTI_PART_TLDS = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "com.tr", "org.tr", "net.tr",
  "com.au", "com.br", "co.jp", "co.nz", "co.za", "com.mx",
]);

/** Subdomains that say nothing about the service. */
const IGNORED_SUBDOMAINS = new Set(["www", "app", "api", "web", "cdn", "static"]);

function titleCase(input: string): string {
  return input
    .split(/[-_.]/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * `https://api.example.com/health` → "API Example · health"
 * `example.com`                    → "Example"
 * `db.internal:5432`               → "DB Internal"
 *
 * A meaningful subdomain becomes part of the name (generic ones like api or
 * www are dropped), the root domain is title-cased, and a path segment is
 * appended as a short qualifier when there is one.
 */
export function deriveMonitorName(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return "";

  let host = url;
  let path = "";
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    host = parsed.hostname;
    path = parsed.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    host = url.replace(/^[a-z]+:\/\//i, "").split(/[/:?#]/)[0] ?? url;
  }

  const parts = host.split(".").filter(Boolean);
  if (parts.length === 0) return titleCase(url);

  // Strip the TLD, two segments deep when needed
  let tldParts = 1;
  if (parts.length >= 3 && MULTI_PART_TLDS.has(parts.slice(-2).join("."))) tldParts = 2;
  const nameParts = parts.slice(0, Math.max(1, parts.length - tldParts));

  const root = nameParts[nameParts.length - 1] ?? parts[0];
  const sub = nameParts.length > 1 ? nameParts[nameParts.length - 2] : undefined;

  let name = titleCase(root);
  if (sub && !IGNORED_SUBDOMAINS.has(sub.toLowerCase())) {
    name = `${titleCase(sub)} ${name}`;
  } else if (sub && sub.toLowerCase() === "api") {
    name = `API ${name}`;
  }

  const firstSegment = path.split("/")[0];
  if (firstSegment && firstSegment.length <= 14 && !/^\d+$/.test(firstSegment)) {
    name = `${name} · ${firstSegment}`;
  }

  return name.slice(0, 60);
}

export type MonitorKind = "http" | "tcp" | "keyword";

/**
 * Guesses the check type from the scheme and port.
 * · `tcp://` or `host:port` on a non-HTTP port → tcp
 * · everything else → http
 * Keyword is never guessed: until someone types a keyword, http is the honest
 * answer.
 */
export function deriveMonitorType(rawUrl: string): MonitorKind {
  const url = rawUrl.trim().toLowerCase();
  if (!url) return "http";
  if (url.startsWith("tcp://")) return "tcp";
  if (/^[a-z]+:\/\//.test(url)) return "http";

  const portMatch = url.match(/^[^/]+:(\d{2,5})(\/|$)/);
  if (portMatch) {
    const port = Number(portMatch[1]);
    if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) return "tcp";
  }
  return "http";
}

/** Human-readable interval: 60 → "1 min", 300 → "5 min". */
export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes} min` : `${seconds}s`;
}

/** The three derived values shown as badges on the form. */
export function deriveMonitorDefaults(rawUrl: string, intervalSeconds: number) {
  return {
    name: deriveMonitorName(rawUrl),
    type: deriveMonitorType(rawUrl),
    intervalLabel: formatInterval(intervalSeconds),
  };
}
