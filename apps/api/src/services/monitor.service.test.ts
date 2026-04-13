import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { executeHttpCheck } from "./monitor.service.js";

function mockFetch(impl: typeof fetch) {
  vi.stubGlobal("fetch", impl);
}

function respond(init: {
  status?: number;
  body?: string;
  delayMs?: number;
}): typeof fetch {
  return (async () => {
    if (init.delayMs) {
      await new Promise((r) => setTimeout(r, init.delayMs));
    }
    return new Response(init.body ?? "", { status: init.status ?? 200 });
  }) as unknown as typeof fetch;
}

describe("executeHttpCheck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns UP for a 200 response and records response time", async () => {
    mockFetch(respond({ status: 200, body: "ok" }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
    });
    expect(result.status).toBe("up");
    expect(result.statusCode).toBe(200);
    expect(result.errorMessage).toBeNull();
    expect(result.responseMs).toBeGreaterThanOrEqual(0);
    expect(result.region).toBe("eu-west");
  });

  it("treats any 2xx–4xx as UP when expectedStatus=200 (browser-like semantics)", async () => {
    mockFetch(respond({ status: 404 }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
    });
    expect(result.status).toBe("up");
    expect(result.statusCode).toBe(404);
  });

  it("returns DOWN for 5xx responses", async () => {
    mockFetch(respond({ status: 503 }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toContain("503");
  });

  it("with a strict expectedStatus, a mismatch returns DOWN", async () => {
    mockFetch(respond({ status: 301 }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 201,
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toContain("Expected 201");
    expect(result.errorMessage).toContain("got 301");
  });

  it("with a strict expectedStatus, an exact match returns UP", async () => {
    mockFetch(respond({ status: 301 }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 301,
    });
    expect(result.status).toBe("up");
  });

  it("returns UP when keyword is present in body (case-insensitive)", async () => {
    mockFetch(respond({ status: 200, body: "Welcome to UptimeCrow!" }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
      keyword: "uptimecrow",
    });
    expect(result.status).toBe("up");
  });

  it("returns DOWN when keyword is missing", async () => {
    mockFetch(respond({ status: 200, body: "<h1>Site under maintenance</h1>" }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
      keyword: "Checkout",
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toContain("Checkout");
    expect(result.errorMessage).toContain("not found");
  });

  it("skips keyword check when status-code check already failed", async () => {
    mockFetch(respond({ status: 500 }));
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
      keyword: "ok",
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toContain("Server error");
    expect(result.errorMessage).not.toContain("Keyword");
  });

  it("surfaces timeouts as DOWN with a clear message", async () => {
    // Fetch that respects the AbortSignal and rejects with AbortError
    mockFetch(((url: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    }) as unknown as typeof fetch);

    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 30,
      expectedStatus: 200,
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toContain("Timeout");
    expect(result.statusCode).toBeNull();
  });

  it("surfaces network errors with the underlying error message", async () => {
    mockFetch((() => Promise.reject(new Error("ECONNREFUSED"))) as unknown as typeof fetch);
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toBe("ECONNREFUSED");
  });

  it("identifies the region in the User-Agent header", async () => {
    let capturedUA: string | null = null;
    mockFetch(((_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      capturedUA = headers?.["User-Agent"] ?? null;
      return Promise.resolve(new Response("ok", { status: 200 }));
    }) as unknown as typeof fetch);

    await executeHttpCheck(
      "https://example.com",
      { timeoutMs: 5000, expectedStatus: 200 },
      "us-east",
    );
    expect(capturedUA).toContain("UptimeCrow");
    expect(capturedUA).toContain("us-east");
  });
});

describe("executeHttpCheck — not called with a keyword", () => {
  beforeEach(() => {
    mockFetch(respond({ status: 200, body: "anything" }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does not read the body when no keyword is provided (perf)", async () => {
    const result = await executeHttpCheck("https://example.com", {
      timeoutMs: 5000,
      expectedStatus: 200,
    });
    expect(result.status).toBe("up");
  });
});
