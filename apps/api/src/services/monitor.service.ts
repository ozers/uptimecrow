// Monitor Service — HTTP check execution with multi-region support

export const REGIONS = ["eu-west", "us-east", "ap-southeast"] as const;
export type Region = (typeof REGIONS)[number];

export interface CheckResult {
  status: "up" | "down" | "degraded";
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  region: Region;
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

    const isUp = response.status === options.expectedStatus;

    return {
      status: isUp ? "up" : "down",
      responseMs,
      statusCode: response.status,
      errorMessage: isUp ? null : `Unexpected status: ${response.status}`,
      region,
    };
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

// Multi-region check: run from multiple regions, majority decides
export async function executeMultiRegionCheck(
  url: string,
  options: { timeoutMs: number; expectedStatus: number },
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
