import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./Landing.css";
import { usePageMeta } from "@/lib/meta";

const BRAND = "UptimeCrow";

const codeBlockStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "1rem 1.25rem",
  overflowX: "auto",
  fontSize: "0.82rem",
};

const CURSOR_CONFIG = `// .cursor/mcp.json
{
  "mcpServers": {
    "uptimecrow": {
      "command": "npx",
      "args": ["@uptimecrow/mcp"],
      "env": {
        "UPTIMECROW_API_KEY": "uc_your_api_key_here"
      }
    }
  }
}`;

const CLAUDE_CONFIG = `// claude_desktop_config.json
{
  "mcpServers": {
    "uptimecrow": {
      "command": "npx",
      "args": ["@uptimecrow/mcp"],
      "env": {
        "UPTIMECROW_API_KEY": "uc_your_api_key_here"
      }
    }
  }
}`;

const EXAMPLE_PROMPTS = [
  { prompt: "Are any of my monitors down right now?", reply: "2 monitors are currently down: api.myapp.com (since 14:32 UTC) and checkout.myapp.com (since 14:35 UTC). Both triggered a CRITICAL incident." },
  { prompt: "Create a monitor for staging.myapp.com", reply: "Done. Monitor created for https://staging.myapp.com — HTTP check every 60 seconds, alerting on 2 consecutive failures." },
  { prompt: "Show me today's incidents", reply: "3 incidents today: 1 resolved (database timeout, 4 min), 2 active. Want me to open a status page update?" },
  { prompt: "Schedule maintenance for this weekend", reply: "Maintenance window created: Saturday 2026-05-16 02:00–04:00 UTC. Notifications suppressed for all affected monitors." },
];

export default function McpPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  usePageMeta({
    title: "MCP Server — UptimeCrow AI Assistant Integration",
    description:
      "Query your monitor status, active incidents, and heartbeats directly from Claude Code, Cursor, or any AI assistant using UptimeCrow's native MCP (Model Context Protocol) server.",
    canonical: "https://uptimecrow.com/mcp",
  });

  return (
    <div className="landing">
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "inherit", textDecoration: "none" }}>
              <img src="/logo.png" alt="UptimeCrow logo" className="logo-img" />
              <span>{BRAND}</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/#features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/docs">Docs</Link>
            <Link to="/login" className="nav-login">Log in</Link>
            <Link to="/register" className="nav-cta">Get Started Free</Link>
          </div>
          <button
            className="nav-hamburger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="nav-mobile" role="dialog" aria-label="Mobile navigation">
            <Link to="/#features" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link to="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link to="/docs" onClick={() => setMobileOpen(false)}>Docs</Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register" className="nav-cta mobile-cta" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">● MCP Server — first in uptime monitoring</div>
          <h1>Ask your AI if your<br />servers are down.</h1>
          <p className="hero-sub">
            {BRAND} is the only uptime monitoring tool with a native MCP server.
            Works with Claude, Cursor, VS Code, and any MCP-compatible AI — right in your editor.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/docs" className="hero-btn secondary">Read the docs</Link>
          </div>
        </div>
      </section>

      {/* What is MCP */}
      <section className="section">
        <div className="container">
          <p className="section-label">Background</p>
          <h2 className="section-title">What is MCP?</h2>
          <div style={{ maxWidth: 760, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7, color: "var(--text2)" }}>
            <p>
              Model Context Protocol (MCP) is an open standard that lets AI assistants connect to external tools
              and data sources. Instead of copy-pasting status URLs or switching tabs, your AI can query
              {" "}{BRAND} directly — reading monitor states, listing incidents, creating monitors, and scheduling
              maintenance, all from a single prompt.
            </p>
            <p style={{ marginTop: "1rem" }}>
              No other uptime monitoring tool has an MCP server. That means zero competition for
              the "uptime monitoring MCP server" keyword — and a genuinely unique workflow for developers
              who live in AI-native editors like Cursor or use Claude as a terminal assistant.
            </p>
          </div>
        </div>
      </section>

      {/* Config snippet */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Install in 30 seconds</p>
          <h2 className="section-title">One config block. Any AI.</h2>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ color: "var(--text2)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Add the {BRAND} MCP server to your AI tool of choice. Grab your API key from
              {" "}<Link to="/dashboard" style={{ color: "var(--accent)" }}>Settings → API Keys</Link>.
            </p>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text)" }}>Cursor / VS Code</p>
            <pre style={codeBlockStyle}><code>{CURSOR_CONFIG}</code></pre>
            <p style={{ fontWeight: 600, margin: "1.5rem 0 0.5rem", color: "var(--text)" }}>Claude Desktop</p>
            <pre style={codeBlockStyle}><code>{CLAUDE_CONFIG}</code></pre>
            <p style={{ color: "var(--text3)", fontSize: "0.85rem", marginTop: "1rem" }}>
              The server runs on-demand via <code>npx</code> — no global install required.
            </p>
          </div>
        </div>
      </section>

      {/* Example prompts */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">What you can ask</p>
          <h2 className="section-title">Your AI knows your infra.</h2>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {EXAMPLE_PROMPTS.map(({ prompt, reply }) => (
              <div key={prompt} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem" }}>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--text)", fontSize: "0.95rem" }}>
                  <span style={{ color: "var(--accent)", marginRight: "0.5rem" }}>You:</span>
                  {prompt}
                </p>
                <p style={{ margin: "0.6rem 0 0", color: "var(--text2)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  <span style={{ color: "var(--text3)", marginRight: "0.5rem" }}>AI:</span>
                  {reply}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Why it matters</p>
          <h2 className="section-title">Built for developer workflows.</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>Zero tab-switching</h3>
              <p>Check monitor status, acknowledge incidents, and schedule maintenance without leaving your editor or terminal.</p>
            </div>
            <div className="feature">
              <h3>Works with your AI stack</h3>
              <p>Claude Desktop, Cursor, VS Code with Copilot, or any tool that speaks MCP. One server, many clients.</p>
            </div>
            <div className="feature">
              <h3>Secure by default</h3>
              <p>API key scoped to read + write on your org. Rotate it any time from Settings. Never stored in the MCP server process.</p>
            </div>
            <div className="feature">
              <h3>No infra to run</h3>
              <p><code>npx @uptimecrow/mcp</code> spins up on demand. Your AI tool manages the process lifetime automatically.</p>
            </div>
            <div className="feature">
              <h3>Full monitoring API</h3>
              <p>Create, pause, delete monitors. List incidents. Schedule maintenance windows. Everything available through natural language.</p>
            </div>
            <div className="feature">
              <h3>Open source server</h3>
              <p>The MCP server is MIT licensed. Fork it, extend it with custom tools, or contribute upstream.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>The only uptime monitor your AI can talk to.</h2>
          <p>Free plan includes 10 monitors and full MCP access. No credit card required.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/docs" className="hero-btn secondary">Read the docs</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/docs">Docs</Link>
              <Link to="/vs/betterstack">vs BetterStack</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
