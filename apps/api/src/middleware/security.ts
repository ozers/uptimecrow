import type { Context, Next } from "hono";

// Security headers applied globally. Kept deliberately conservative so the
// pre-rendered status pages (inline styles, one inline boot script) still work.
// HSTS is only set in production — dev usually runs over plain HTTP.
export async function securityHeaders(c: Context, next: Next) {
  await next();
  const h = c.res.headers;

  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "SAMEORIGIN");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CSP: allow the subscribe form to POST back to same-origin, and the status
  // page inline <style> + boot script. Google Fonts for the status page.
  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "script-src 'self' 'unsafe-inline' https://plausible.io",
      "connect-src 'self' https://plausible.io",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );

  if (process.env.NODE_ENV === "production") {
    h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}
