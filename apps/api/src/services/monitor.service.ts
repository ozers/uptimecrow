// Monitor Service — HTTP check execution
// Will be fully implemented in Week 2

export interface CheckResult {
  status: "up" | "down" | "degraded";
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function executeHttpCheck(
  url: string,
  options: {
    timeoutMs: number;
    expectedStatus: number;
  },
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
        "User-Agent": "UptimeCrow/1.0 (Uptime Monitor)",
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
    };
  } catch (err: any) {
    const responseMs = Date.now() - start;

    return {
      status: "down",
      responseMs,
      statusCode: null,
      errorMessage: err.name === "AbortError" ? `Timeout after ${options.timeoutMs}ms` : err.message,
    };
  }
}
