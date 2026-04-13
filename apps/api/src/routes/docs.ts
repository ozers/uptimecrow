import { Hono } from "hono";
import { buildOpenApiDocument } from "../docs/openapi.js";

export const docsRoutes = new Hono();

docsRoutes.get("/openapi.json", (c) => c.json(buildOpenApiDocument()));

// Swagger UI page. Uses its own relaxed CSP so the CDN-hosted script and
// stylesheet can load. jsDelivr is widely available and hashed-pinned.
docsRoutes.get("/docs", (c) => {
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "font-src 'self' https://cdn.jsdelivr.net data:",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "connect-src 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
  c.header("Content-Security-Policy", csp);
  c.header("Content-Type", "text/html; charset=UTF-8");
  return c.body(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UptimeCrow API Docs</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>body{margin:0;background:#0a0a0f}#swagger-ui{max-width:1200px;margin:0 auto}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
    });
  </script>
</body>
</html>`);
});
