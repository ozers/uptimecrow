// Monitor Service — HTTP/TCP check execution with keyword support

import net from "node:net";
import tls from "node:tls";
import { logger } from "../utils/logger.js";
import { assertPublicUrl, assertPublicHost, SsrfBlockedError } from "../utils/ssrf.js";
import { daysUntil } from "../utils/expiry.js";

export interface CheckResult {
  status: "up" | "down" | "degraded";
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export interface TestCheckResult extends CheckResult {
  bodyPreview: string;
  bodyLength: number;
  warnings: string[];
}

export async function executeHttpCheck(
  url: string,
  options: {
    timeoutMs: number;
    expectedStatus: number;
    keyword?: string | null;
  },
): Promise<CheckResult> {
  const start = Date.now();

  try {
    await assertPublicUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "User-Agent": "UptimeCrow/1.0",
      },
    });

    clearTimeout(timeout);
    const responseMs = Date.now() - start;

    let status: "up" | "down" | "degraded";
    let errorMessage: string | null = null;

    // Status code check
    if (options.expectedStatus !== 200) {
      status = response.status === options.expectedStatus ? "up" : "down";
      if (status === "down") errorMessage = `Expected ${options.expectedStatus}, got ${response.status}`;
    } else {
      if (response.status >= 200 && response.status < 500) {
        status = "up";
      } else {
        status = "down";
        errorMessage = `Server error: ${response.status}`;
      }
    }

    // Keyword check (only if status code passed and keyword is set)
    if (status === "up" && options.keyword) {
      const body = await response.text();
      const found = body.toLowerCase().includes(options.keyword.toLowerCase());
      if (!found) {
        status = "down";
        errorMessage = `Keyword "${options.keyword}" not found in response`;
      }
    }

    return { status, responseMs, statusCode: response.status, errorMessage };
  } catch (err: any) {
    const responseMs = Date.now() - start;
    if (err instanceof SsrfBlockedError) {
      return { status: "down", responseMs, statusCode: null, errorMessage: `Target rejected: ${err.message}` };
    }
    return {
      status: "down",
      responseMs,
      statusCode: null,
      errorMessage: err.name === "AbortError" ? `Timeout after ${options.timeoutMs / 1000}s` : err.message,
    };
  }
}

// Test check — returns body preview for keyword selection
export async function executeTestCheck(
  url: string,
  options: { timeoutMs: number; expectedStatus: number; keyword?: string | null },
): Promise<TestCheckResult> {
  const start = Date.now();

  try {
    await assertPublicUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "manual",
      headers: { "User-Agent": "UptimeCrow/1.0 (test)" },
    });

    clearTimeout(timeout);
    const responseMs = Date.now() - start;
    const body = await response.text();

    let status: "up" | "down" | "degraded";
    let errorMessage: string | null = null;

    if (options.expectedStatus !== 200) {
      status = response.status === options.expectedStatus ? "up" : "down";
      if (status === "down") errorMessage = `Expected ${options.expectedStatus}, got ${response.status}`;
    } else {
      if (response.status >= 200 && response.status < 500) {
        status = "up";
      } else {
        status = "down";
        errorMessage = `Server error: ${response.status}`;
      }
    }

    if (status === "up" && options.keyword) {
      const found = body.toLowerCase().includes(options.keyword.toLowerCase());
      if (!found) {
        status = "down";
        errorMessage = `Keyword "${options.keyword}" not found in response`;
      }
    }

    // Extract readable text preview from HTML
    const textPreview = body
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    // Detect warnings
    const warnings: string[] = [];
    const bodyLower = body.toLowerCase();
    const previewLower = textPreview.toLowerCase();

    // Soft 404 detection: server returns 200 but content says "not found"
    if (response.status === 200) {
      const soft404Patterns = ["page not found", "404", "not found", "does not exist", "page doesn't exist", "sayfa bulunamadı"];
      const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/i);
      const titleText = titleMatch?.[1]?.toLowerCase() || "";

      if (soft404Patterns.some((p) => titleText.includes(p))) {
        warnings.push(`Soft 404 detected: page title contains "${titleMatch?.[1]?.trim()}". The server returns 200 but this page may not exist.`);
      } else if (soft404Patterns.some((p) => previewLower.includes(p)) && body.length < 10000) {
        warnings.push("This might be a 404 page — the response contains \"not found\" text. If you're monitoring a specific page, make sure the URL is correct.");
      }
    }

    // SPA detection
    const isSpa = body.includes('id="root"') || body.includes('id="app"') || body.includes('id="__next"') || body.includes('id="__nuxt"');
    if (response.status === 200 && isSpa && body.length < 5000) {
      warnings.push("JS-rendered site detected. Adding a keyword (e.g. your site name from meta tags) is recommended for more accurate monitoring.");
    }

    // Very small response
    if (body.length < 100 && response.status === 200) {
      warnings.push("Very small response body. This might be a redirect page or an empty response.");
    }

    // Slow response
    if (responseMs > 3000) {
      warnings.push(`Slow response time (${responseMs}ms). This may cause intermittent timeout failures.`);
    }

    return {
      status,
      responseMs,
      statusCode: response.status,
      errorMessage,
      bodyPreview: textPreview,
      bodyLength: body.length,
      warnings,
    };
  } catch (err: any) {
    const responseMs = Date.now() - start;
    if (err instanceof SsrfBlockedError) {
      return {
        status: "down", responseMs, statusCode: null,
        errorMessage: `Target rejected: ${err.message}`,
        bodyPreview: "", bodyLength: 0,
        warnings: ["This target points to a private/internal address and is blocked for security reasons."],
      };
    }
    return {
      status: "down",
      responseMs,
      statusCode: null,
      errorMessage: err.name === "AbortError" ? `Timeout after ${options.timeoutMs / 1000}s` : err.message,
      bodyPreview: "",
      bodyLength: 0,
      warnings: [],
    };
  }
}

// TCP check — opens a raw socket to host:port and measures connect time.
// Accepts "host:port" or an URL (we only use hostname/port). A successful TCP
// handshake within the timeout is "up"; anything else is "down".
export async function executeTcpCheck(
  target: string,
  options: { timeoutMs: number },
): Promise<CheckResult> {
  const start = Date.now();
  let host: string;
  let port: number;

  try {
    if (target.includes("://")) {
      const u = new URL(target);
      host = u.hostname;
      port = u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
    } else {
      const [h, p] = target.split(":");
      host = h;
      port = Number(p);
    }
    if (!host || !Number.isFinite(port) || port <= 0 || port > 65535) {
      return {
        status: "down",
        responseMs: Date.now() - start,
        statusCode: null,
        errorMessage: "Invalid host:port",
      };
    }
    await assertPublicHost(host);
  } catch (err: unknown) {
    if (err instanceof SsrfBlockedError) {
      return {
        status: "down",
        responseMs: Date.now() - start,
        statusCode: null,
        errorMessage: `Target rejected: ${err.message}`,
      };
    }
    return {
      status: "down",
      responseMs: Date.now() - start,
      statusCode: null,
      errorMessage: err instanceof Error ? err.message : "Invalid target",
    };
  }

  return new Promise<CheckResult>((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (status: "up" | "down", errorMessage: string | null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        status,
        responseMs: Date.now() - start,
        statusCode: null,
        errorMessage,
      });
    };

    socket.setTimeout(options.timeoutMs);
    socket.once("connect", () => done("up", null));
    socket.once("timeout", () => done("down", `Timeout after ${options.timeoutMs / 1000}s`));
    socket.once("error", (err) => done("down", err.message));
    socket.connect(port, host);
  });
}

// SSL certificate expiry check
export interface SslCheckResult {
  expiresAt: Date | null;
  daysRemaining: number | null;
  status: "ok" | "expiring_soon" | "expired" | "error";
}

export async function checkSslExpiry(url: string): Promise<SslCheckResult> {
  let hostname: string;
  let port = 443;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return { expiresAt: null, daysRemaining: null, status: "ok" };
    hostname = parsed.hostname;
    if (parsed.port) port = parseInt(parsed.port, 10);
  } catch {
    return { expiresAt: null, daysRemaining: null, status: "error" };
  }

  try {
    await assertPublicHost(hostname);
  } catch {
    return { expiresAt: null, daysRemaining: null, status: "error" };
  }

  return new Promise((resolve) => {
    const socket = tls.connect({ host: hostname, port, servername: hostname, rejectUnauthorized: false }, () => {
      try {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        if (!cert?.valid_to) return resolve({ expiresAt: null, daysRemaining: null, status: "error" });
        const expiresAt = new Date(cert.valid_to);
        const daysRemaining = daysUntil(expiresAt);
        let status: SslCheckResult["status"] = "ok";
        if (daysRemaining < 0) status = "expired";
        else if (daysRemaining < 14) status = "expiring_soon";
        resolve({ expiresAt, daysRemaining, status });
      } catch {
        socket.destroy();
        resolve({ expiresAt: null, daysRemaining: null, status: "error" });
      }
    });
    socket.on("error", () => resolve({ expiresAt: null, daysRemaining: null, status: "error" }));
    socket.setTimeout(5000, () => { socket.destroy(); resolve({ expiresAt: null, daysRemaining: null, status: "error" }); });
  });
}

export interface DomainCheckResult {
  expiresAt: Date | null;
  daysRemaining: number | null;
  status: "ok" | "expiring_soon" | "expired" | "error";
}

export async function checkDomainExpiry(url: string): Promise<DomainCheckResult> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return { expiresAt: null, daysRemaining: null, status: "error" };
  }

  // Strip www and subdomains to get registrable domain for WHOIS lookup
  const parts = hostname.split(".");
  const domain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  try {
    const { whoisDomain } = await import("whoiser");
    const result = await Promise.race([
      whoisDomain(domain, { timeout: 8000, follow: 1 }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10_000)),
    ]) as Record<string, Record<string, unknown>>;

    // whoiser returns an object keyed by WHOIS server; grab the first result
    const data = Object.values(result ?? {})[0] ?? {};

    // Look for expiry date under common field names across registrars
    const expiryRaw =
      (data["Registry Expiry Date"] as string | undefined) ||
      (data["Registrar Registration Expiration Date"] as string | undefined) ||
      (data["Expiration Date"] as string | undefined) ||
      (data["paid-till"] as string | undefined) ||
      (data["renewal date"] as string | undefined);

    if (!expiryRaw) return { expiresAt: null, daysRemaining: null, status: "error" };

    const expiresAt = new Date(expiryRaw as string);
    if (isNaN(expiresAt.getTime())) return { expiresAt: null, daysRemaining: null, status: "error" };

    const daysRemaining = daysUntil(expiresAt);
    const status: DomainCheckResult["status"] =
      daysRemaining < 0 ? "expired" :
      daysRemaining < 30 ? "expiring_soon" :
      "ok";

    return { expiresAt, daysRemaining, status };
  } catch (err) {
    logger.debug({ err, domain }, "[Domain] WHOIS lookup failed");
    return { expiresAt: null, daysRemaining: null, status: "error" };
  }
}
