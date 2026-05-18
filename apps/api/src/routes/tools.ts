import { Hono } from "hono";
import tls from "node:tls";
import { promises as dnsPromises } from "node:dns";
import { z } from "zod";
import { assertPublicHost, SsrfBlockedError } from "../utils/ssrf.js";
import { executeTestCheck } from "../services/monitor.service.js";

export const toolsRoutes = new Hono();

const sslSchema = z.object({
  hostname: z.string().min(1).max(255),
});

const dnsSchema = z.object({
  hostname: z.string().min(1).max(255),
  recordType: z.enum(["A", "AAAA", "MX", "TXT", "NS", "CNAME"]).default("A"),
});

const uptimeSchema = z.object({
  url: z.string().url().max(2048),
});

function parseHostname(input: string): string {
  // Accept full URLs or bare hostnames.
  try {
    if (input.includes("://")) return new URL(input).hostname;
  } catch {
    /* fall through */
  }
  return input.replace(/^\/+|\/+$/g, "");
}

toolsRoutes.post("/ssl-check", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = sslSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid hostname" }, 400);

  const hostname = parseHostname(parsed.data.hostname);
  if (!hostname) return c.json({ error: "Invalid hostname" }, 400);

  try {
    await assertPublicHost(hostname);
  } catch (err) {
    if (err instanceof SsrfBlockedError) {
      return c.json({ error: `Target rejected: ${err.message}` }, 400);
    }
    return c.json({ error: "Unable to resolve hostname" }, 400);
  }

  const result = await new Promise<{
    hostname: string;
    validFrom: string | null;
    validTo: string | null;
    daysRemaining: number | null;
    issuer: string | null;
    subject: string | null;
    serialNumber: string | null;
    status: "ok" | "expiring_soon" | "expired" | "error";
    error: string | null;
  }>((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false, timeout: 8000 },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (!cert?.valid_to) {
            resolve({
              hostname,
              validFrom: null,
              validTo: null,
              daysRemaining: null,
              issuer: null,
              subject: null,
              serialNumber: null,
              status: "error",
              error: "No certificate returned",
            });
            return;
          }
          const expiresAt = new Date(cert.valid_to);
          const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
          let status: "ok" | "expiring_soon" | "expired" = "ok";
          if (daysRemaining < 0) status = "expired";
          else if (daysRemaining < 14) status = "expiring_soon";
          const toStr = (v: unknown): string | null =>
            Array.isArray(v) ? (v[0] ?? null) : typeof v === "string" ? v : null;
          const issuer = toStr(cert.issuer?.O) || toStr(cert.issuer?.CN);
          const subject = toStr(cert.subject?.CN);
          resolve({
            hostname,
            validFrom: cert.valid_from ?? null,
            validTo: cert.valid_to,
            daysRemaining,
            issuer,
            subject,
            serialNumber: cert.serialNumber ?? null,
            status,
            error: null,
          });
        } catch (err) {
          socket.destroy();
          resolve({
            hostname,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            issuer: null,
            subject: null,
            serialNumber: null,
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      },
    );
    socket.on("error", (err) =>
      resolve({
        hostname,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        issuer: null,
        subject: null,
        serialNumber: null,
        status: "error",
        error: err.message,
      }),
    );
    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve({
        hostname,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        issuer: null,
        subject: null,
        serialNumber: null,
        status: "error",
        error: "Connection timed out",
      });
    });
  });

  return c.json(result);
});

toolsRoutes.post("/dns-lookup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = dnsSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid input" }, 400);

  const hostname = parseHostname(parsed.data.hostname);
  if (!hostname || !/^[a-z0-9.-]+$/i.test(hostname)) {
    return c.json({ error: "Invalid hostname" }, 400);
  }

  try {
    let records: unknown;
    switch (parsed.data.recordType) {
      case "A":
        records = await dnsPromises.resolve4(hostname);
        break;
      case "AAAA":
        records = await dnsPromises.resolve6(hostname);
        break;
      case "MX":
        records = await dnsPromises.resolveMx(hostname);
        break;
      case "TXT":
        records = (await dnsPromises.resolveTxt(hostname)).map((chunks) => chunks.join(""));
        break;
      case "NS":
        records = await dnsPromises.resolveNs(hostname);
        break;
      case "CNAME":
        records = await dnsPromises.resolveCname(hostname);
        break;
    }
    return c.json({
      hostname,
      recordType: parsed.data.recordType,
      records,
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    const message =
      code === "ENOTFOUND" || code === "ENODATA"
        ? `No ${parsed.data.recordType} records found for ${hostname}`
        : err instanceof Error
          ? err.message
          : "DNS lookup failed";
    return c.json({
      hostname,
      recordType: parsed.data.recordType,
      records: [],
      error: message,
    });
  }
});

toolsRoutes.post("/uptime-test", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = uptimeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid URL" }, 400);

  const result = await executeTestCheck(parsed.data.url, {
    timeoutMs: 10_000,
    expectedStatus: 200,
    keyword: null,
  });

  // Return only what's needed publicly; suppress body preview for privacy.
  return c.json({
    url: parsed.data.url,
    status: result.status,
    statusCode: result.statusCode,
    responseMs: result.responseMs,
    errorMessage: result.errorMessage,
    warnings: result.warnings,
    bodyLength: result.bodyLength,
  });
});
