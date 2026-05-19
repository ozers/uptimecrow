import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Copy, Check } from "lucide-react";
import "./Landing.css";
import { analytics } from "@/lib/analytics";
import { usePageMeta } from "@/lib/meta";
import { MarketingLayout } from "@/components/layout/MarketingLayout";

const BRAND = "UptimeCrow";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ position: "relative", marginBottom: "1rem" }}>
      <pre style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "1rem 1.25rem",
        overflowX: "auto",
        fontSize: "0.82rem",
        lineHeight: 1.7,
        color: "var(--text2)",
        margin: 0,
      }}>
        <code className={`language-${lang}`}>{code}</code>
      </pre>
      <button
        onClick={copy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "0.72rem",
          padding: "3px 8px",
        }}
        aria-label="Copy code"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const DOCS_NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Pricing", to: "/pricing" },
  { label: "API Reference", href: "/api/docs", external: true },
];

const DOCS_FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Pricing", to: "/pricing" },
  { label: "API Docs", to: "/docs" },
  { label: "Privacy", to: "/privacy" },
  { label: "Log in", to: "/login" },
];

export function Docs() {
  useEffect(() => { analytics.docsViewed(); }, []);

  usePageMeta({
    title: "API Documentation — UptimeCrow Developer Docs",
    description:
      "UptimeCrow REST API reference for monitors, incidents, status pages, and heartbeats. Authenticate with API keys. Full OpenAPI spec available.",
    canonical: "https://uptimecrow.com/docs",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      name: "UptimeCrow API Documentation",
      url: "https://uptimecrow.com/docs",
      description:
        "REST API reference for monitors, incidents, status pages, and heartbeats.",
    },
  });

  return (
    <MarketingLayout navLinks={DOCS_NAV_LINKS} footerLinks={DOCS_FOOTER_LINKS}>
      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Developer API</div>
          <h1>REST API for uptime monitoring</h1>
          <p className="hero-sub">
            Automate monitor creation, trigger incidents, manage status pages — all from your CI/CD pipeline, scripts, or the{" "}
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>MCP server</a>.
          </p>
          <div className="hero-actions">
            <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="hero-btn primary">
              Open API Reference <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: "middle" }} />
            </a>
            <Link to="/register" className="hero-btn secondary">Get API Key Free</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container" style={{ maxWidth: 860 }}>

          {/* Authentication */}
          <div style={{ marginBottom: "3rem" }}>
            <p className="section-label">Authentication</p>
            <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>API Keys</h2>
            <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: "1rem" }}>
              Create an API key in <strong>Settings → API Keys</strong> (Indie plan or higher).
              Pass it as a Bearer token in every request:
            </p>
            <CodeBlock code={`curl https://uptimecrow.com/api/monitors \\
  -H "Authorization: Bearer uc_live_your_key_here"`} />
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem 1.25rem", fontSize: "0.88rem", color: "var(--text2)" }}>
              <strong style={{ color: "var(--text)" }}>Rate limits:</strong> 100 requests / minute per key.
              Keys are scoped to your organization — one key can manage all your monitors and status pages.
            </div>
          </div>

          {/* Quick Start */}
          <div style={{ marginBottom: "3rem" }}>
            <p className="section-label">Quick Start</p>
            <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>5 minutes to full monitoring</h2>

            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>1. Create a monitor</h3>
            <CodeBlock code={`curl -X POST https://uptimecrow.com/api/monitors \\
  -H "Authorization: Bearer uc_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API",
    "url": "https://api.yourapp.com/health",
    "type": "http",
    "intervalSeconds": 60
  }'`} />

            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "1.5rem 0 0.5rem", color: "var(--text)" }}>2. Add a heartbeat for your cron job</h3>
            <CodeBlock code={`# Create the heartbeat
curl -X POST https://uptimecrow.com/api/heartbeats \\
  -H "Authorization: Bearer uc_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Nightly backup", "period": 86400, "grace": 300}'

# Then add to your cron job (use the pingUrl from the response):
# 0 2 * * * /run-backup.sh && curl -s https://uptimecrow.com/heartbeat/your-slug`} />

            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "1.5rem 0 0.5rem", color: "var(--text)" }}>3. Create an incident manually</h3>
            <CodeBlock code={`curl -X POST https://uptimecrow.com/api/incidents \\
  -H "Authorization: Bearer uc_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "statusPageId": "your-status-page-id",
    "title": "Investigating elevated error rates",
    "severity": "major",
    "status": "investigating",
    "body": "We are investigating elevated error rates on our API. Updates to follow."
  }'`} />

            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "1.5rem 0 0.5rem", color: "var(--text)" }}>4. Resolve it</h3>
            <CodeBlock code={`curl -X POST https://uptimecrow.com/api/incidents/{id}/updates \\
  -H "Authorization: Bearer uc_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "resolved", "body": "The issue has been resolved. All systems operational."}'`} />
          </div>

          {/* Endpoints overview */}
          <div style={{ marginBottom: "3rem" }}>
            <p className="section-label">Endpoints</p>
            <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "1.25rem" }}>Full API surface</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {[
                { tag: "Monitors", color: "#00e676", endpoints: ["GET /api/monitors", "POST /api/monitors", "GET /api/monitors/:id", "PATCH /api/monitors/:id", "DELETE /api/monitors/:id", "GET /api/monitors/:id/checks"] },
                { tag: "Heartbeats", color: "#69f0ae", endpoints: ["GET /api/heartbeats", "POST /api/heartbeats", "PATCH /api/heartbeats/:id", "DELETE /api/heartbeats/:id", "GET /heartbeat/:slug (public)"] },
                { tag: "Incidents", color: "#ff7043", endpoints: ["GET /api/incidents", "POST /api/incidents", "GET /api/incidents/:id", "PATCH /api/incidents/:id", "POST /api/incidents/:id/updates"] },
                { tag: "Status Pages", color: "#40c4ff", endpoints: ["GET /api/status-pages", "GET /api/status-pages/:id", "PUT /api/status-pages/:id/monitors"] },
                { tag: "Maintenance", color: "#ffd740", endpoints: ["GET /api/maintenance-windows", "POST /api/maintenance-windows", "PATCH /api/maintenance-windows/:id", "DELETE /api/maintenance-windows/:id"] },
                { tag: "API Keys", color: "#e040fb", endpoints: ["GET /api/api-keys", "POST /api/api-keys", "DELETE /api/api-keys/:id"] },
              ].map((group) => (
                <div key={group.tag} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem 1.25rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: group.color, marginBottom: "0.6rem" }}>
                    {group.tag}
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {group.endpoints.map((ep) => (
                      <li key={ep} style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "var(--text2)", lineHeight: 1.9 }}>{ep}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* MCP Server */}
          <div style={{ marginBottom: "3rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.8rem" }}>
            <p className="section-label" style={{ margin: 0 }}>AI-native</p>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.5rem 0 0.75rem" }}>MCP Server</h3>
            <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: "1rem" }}>
              {BRAND} ships an <strong>MCP (Model Context Protocol) server</strong> — the only uptime monitoring
              tool with one. Connect it to Claude, Cursor, or any MCP-compatible AI to manage your infrastructure
              conversationally.
            </p>
            <CodeBlock lang="json" code={`// .cursor/mcp.json or claude_desktop_config.json
{
  "mcpServers": {
    "uptimecrow": {
      "command": "npx",
      "args": ["-y", "@uptimecrow/mcp"],
      "env": { "UPTIMECROW_API_KEY": "uc_live_your_key_here" }
    }
  }
}`} />
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              Open interactive API reference
              <ExternalLink size={14} />
            </a>
            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text3)" }}>
              Powered by Swagger UI — try every endpoint in the browser.
            </p>
          </div>

        </div>
      </section>
    </MarketingLayout>
  );
}
