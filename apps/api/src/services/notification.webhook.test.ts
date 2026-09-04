import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendCustomWebhook } from "./notification.service.js";

// User-supplied webhook URLs are dialled by the server, so the request options
// are a security boundary, not a detail:
//   - `redirect: "manual"` keeps a 302 from walking us past the SSRF guard,
//     which only ever sees the URL the user configured.
//   - a timeout keeps a webhook that accepts and stalls from pinning a worker.

const PARAMS = {
  webhookUrl: "http://127.0.0.1:9/hook",
  type: "incident_created" as const,
  statusPageName: "Test",
  incidentTitle: "Test",
  updateBody: "body",
};

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // The guard is exercised by ssrf.test.ts; here we need a reachable-looking
  // target so the request options are what is under test.
  process.env.ALLOW_PRIVATE_TARGETS = "1";
  fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ALLOW_PRIVATE_TARGETS;
});

describe("outbound webhook requests", () => {
  it("never follows redirects", async () => {
    await sendCustomWebhook(PARAMS);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });

  it("carries an abort signal so a stalled webhook cannot hang the worker", async () => {
    await sendCustomWebhook(PARAMS);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("still sends the caller's method, headers and body", async () => {
    await sendCustomWebhook(PARAMS);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({ event: "incident_created" });
  });
});
