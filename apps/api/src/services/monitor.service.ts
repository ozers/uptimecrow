// Monitor Service — HTTP check execution with multi-region + keyword support

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

    return {
      status,
      responseMs,
      statusCode: response.status,
      errorMessage,
      region: "eu-west",
      bodyPreview: textPreview,
      bodyLength: body.length,
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
    };
  }
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
