// Monitor Service — HTTP/TCP check execution with multi-region + keyword support

import net from "node:net";

export const REGIONS = ["eu-west", "us-east", "ap-southeast"] as const;
export type Region = (typeof REGIONS)[number];

export interface CheckResult {
  status: "up" | "down" | "degraded";
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  region: Region;
}

export interface TestCheckResult extends CheckResult {
  bodyPreview: string;
  bodyLength: number;
  warnings: string[];
}

export interface MultiRegionResult {
  overallStatus: "up" | "down" | "degraded";
  results: CheckResult[];
}

export async function executeHttpCheck(
  url: string,
  options: {
    timeoutMs: number;
    expectedStatus: number;
    keyword?: string | null;
  },
  region: Region = "eu-west",
): Promise<CheckResult> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": `UptimeCrow/1.0 (${region})`,
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

    return { status, responseMs, statusCode: response.status, errorMessage, region };
  } catch (err: any) {
    const responseMs = Date.now() - start;
    return {
      status: "down",
      responseMs,
      statusCode: null,
      errorMessage: err.name === "AbortError" ? `Timeout after ${options.timeoutMs}ms` : err.message,
      region,
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
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
      region: "eu-west",
      bodyPreview: textPreview,
      bodyLength: body.length,
      warnings,
    };
  } catch (err: any) {
    const responseMs = Date.now() - start;
    return {
      status: "down",
      responseMs,
      statusCode: null,
      errorMessage: err.name === "AbortError" ? `Timeout after ${options.timeoutMs}ms` : err.message,
      region: "eu-west",
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
  region: Region = "eu-west",
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
        region,
      };
    }
  } catch (err: unknown) {
    return {
      status: "down",
      responseMs: Date.now() - start,
      statusCode: null,
      errorMessage: err instanceof Error ? err.message : "Invalid target",
      region,
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
        region,
      });
    };

    socket.setTimeout(options.timeoutMs);
    socket.once("connect", () => done("up", null));
    socket.once("timeout", () => done("down", `Timeout after ${options.timeoutMs}ms`));
    socket.once("error", (err) => done("down", err.message));
    socket.connect(port, host);
  });
}

// Multi-region check
export async function executeMultiRegionCheck(
  url: string,
  options: { timeoutMs: number; expectedStatus: number; keyword?: string | null },
  regions: Region[] = [...REGIONS],
): Promise<MultiRegionResult> {
  const results = await Promise.all(
    regions.map((region) => executeHttpCheck(url, options, region)),
  );

  const upCount = results.filter((r) => r.status === "up").length;
  const downCount = results.filter((r) => r.status === "down").length;
  const majority = Math.ceil(regions.length / 2);

  let overallStatus: "up" | "down" | "degraded";
  if (upCount >= majority) {
    overallStatus = downCount > 0 ? "degraded" : "up";
  } else {
    overallStatus = "down";
  }

  return { overallStatus, results };
}
