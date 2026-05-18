import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { ToolsLayout } from "./ToolsLayout";
import { usePageMeta } from "@/lib/meta";

interface UptimeResult {
  url: string;
  status: "up" | "down" | "degraded";
  statusCode: number | null;
  responseMs: number | null;
  errorMessage: string | null;
  warnings: string[];
  bodyLength: number;
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.25rem 1.5rem",
};

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function UptimeTest() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UptimeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Free Uptime Tester — UptimeCrow",
    description:
      "Run a single HTTP uptime check against any URL. See status code, response time, and detect common issues like soft 404s, SPA detection, and slow responses.",
    canonical: "https://uptimecrow.com/tools/uptime-test",
  });

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    if (normalized !== url) setUrl(normalized);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/uptime-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const StatusIcon = result?.status === "up"
    ? CheckCircle2
    : result?.status === "degraded"
      ? AlertTriangle
      : XCircle;
  const statusColor =
    result?.status === "up"
      ? "var(--accent)"
      : result?.status === "degraded"
        ? "#ffab40"
        : "var(--danger, #ff5252)";

  return (
    <ToolsLayout>
      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Free Uptime Tool</div>
          <h1>Uptime Tester</h1>
          <p className="hero-sub">
            Run a single check against any URL. We measure response time, validate the status code,
            and detect common gotchas — soft 404s, SPAs that need a keyword, and slow responses.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <form onSubmit={run} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <label htmlFor="uptime-url" style={{ fontWeight: 600, color: "var(--text)" }}>
              URL
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                id="uptime-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: "0.75rem 1rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "1rem",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="hero-btn primary"
                style={{ minWidth: 140 }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Run Check"}
              </button>
            </div>
            <p style={{ color: "var(--text3)", fontSize: "0.85rem", margin: 0 }}>
              Limit: 10 checks per minute per IP. Private/internal IPs are blocked.
            </p>
          </form>

          {error && (
            <div style={{ ...cardStyle, borderColor: "var(--danger, #ff5252)", color: "var(--danger, #ff5252)" }}>
              {error}
            </div>
          )}

          {result && (
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <StatusIcon size={28} style={{ color: statusColor }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", wordBreak: "break-all" }}>
                    {result.url}
                  </p>
                  <p style={{ margin: 0, color: statusColor, fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" }}>
                    {result.status} {result.statusCode != null && `· HTTP ${result.statusCode}`}
                  </p>
                </div>
              </div>

              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.4rem 1.25rem", margin: 0, fontSize: "0.9rem" }}>
                <dt style={{ color: "var(--text3)" }}>Response time</dt>
                <dd style={{ margin: 0, color: "var(--text)" }}>{result.responseMs != null ? `${result.responseMs} ms` : "—"}</dd>
                <dt style={{ color: "var(--text3)" }}>Body size</dt>
                <dd style={{ margin: 0, color: "var(--text)" }}>{result.bodyLength} bytes</dd>
                {result.errorMessage && (
                  <>
                    <dt style={{ color: "var(--text3)" }}>Error</dt>
                    <dd style={{ margin: 0, color: "var(--text)" }}>{result.errorMessage}</dd>
                  </>
                )}
              </dl>

              {result.warnings.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ margin: 0, marginBottom: "0.5rem", fontWeight: 600, color: "#ffab40", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <AlertTriangle size={16} /> Warnings
                  </p>
                  <ul style={{ paddingLeft: "1.25rem", margin: 0, color: "var(--text2)", lineHeight: 1.6 }}>
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p className="section-label">Why this matters</p>
          <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
            <Activity size={28} style={{ verticalAlign: "middle", marginRight: "0.5rem", color: "var(--accent)" }} />
            One check is a snapshot. Real monitoring runs forever.
          </h2>
          <p style={{ color: "var(--text2)", lineHeight: 1.7 }}>
            This tool runs the same check engine UptimeCrow uses for monitoring. The difference is
            cadence: a one-shot check tells you "it's up right now"; UptimeCrow runs it every 60
            seconds, opens incidents on failure, updates a public status page, and pages your team.
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/register" className="hero-btn primary">Monitor this URL forever — free</Link>
          </div>
        </div>
      </section>
    </ToolsLayout>
  );
}
