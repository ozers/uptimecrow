import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { ToolsLayout } from "./ToolsLayout";
import { usePageMeta } from "@/lib/meta";

interface SslResult {
  hostname: string;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  issuer: string | null;
  subject: string | null;
  serialNumber: string | null;
  status: "ok" | "expiring_soon" | "expired" | "error";
  error: string | null;
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.25rem 1.5rem",
};

export default function SslChecker() {
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SslResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Free SSL Certificate Checker — UptimeCrow",
    description:
      "Check any domain's SSL certificate expiry, issuer, and validity dates. Free, instant, no signup. Built by UptimeCrow.",
    canonical: "https://uptimecrow.com/tools/ssl-checker",
  });

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!hostname.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/ssl-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: hostname.trim() }),
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

  const StatusIcon = result?.status === "expired"
    ? ShieldX
    : result?.status === "expiring_soon"
      ? ShieldAlert
      : ShieldCheck;
  const statusColor =
    result?.status === "expired"
      ? "var(--danger, #ff5252)"
      : result?.status === "expiring_soon"
        ? "#ffab40"
        : result?.status === "ok"
          ? "var(--accent)"
          : "var(--text3)";

  return (
    <ToolsLayout>
      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Free SSL Tool</div>
          <h1>SSL Certificate<br />Checker</h1>
          <p className="hero-sub">
            Check any domain's SSL certificate. See expiry date, issuer, and validity status —
            instantly and without signup.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <form onSubmit={run} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <label htmlFor="ssl-host" style={{ fontWeight: 600, color: "var(--text)" }}>
              Domain or URL
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                id="ssl-host"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="example.com or https://example.com"
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Check SSL"}
              </button>
            </div>
            <p style={{ color: "var(--text3)", fontSize: "0.85rem", margin: 0 }}>
              Limit: 10 checks per minute per IP.
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
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>
                    {result.hostname}
                  </p>
                  <p style={{ margin: 0, color: statusColor, fontWeight: 600, fontSize: "0.9rem" }}>
                    {result.status === "expired" && "Certificate expired"}
                    {result.status === "expiring_soon" && `Expires in ${result.daysRemaining} days — renew soon`}
                    {result.status === "ok" && `Valid — ${result.daysRemaining} days remaining`}
                    {result.status === "error" && (result.error || "Could not retrieve certificate")}
                  </p>
                </div>
              </div>

              {result.validTo && (
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1.25rem", margin: 0, fontSize: "0.9rem" }}>
                  <dt style={{ color: "var(--text3)" }}>Issuer</dt>
                  <dd style={{ margin: 0, color: "var(--text)" }}>{result.issuer || "—"}</dd>
                  <dt style={{ color: "var(--text3)" }}>Subject</dt>
                  <dd style={{ margin: 0, color: "var(--text)" }}>{result.subject || "—"}</dd>
                  <dt style={{ color: "var(--text3)" }}>Valid from</dt>
                  <dd style={{ margin: 0, color: "var(--text)" }}>{result.validFrom}</dd>
                  <dt style={{ color: "var(--text3)" }}>Valid to</dt>
                  <dd style={{ margin: 0, color: "var(--text)" }}>{result.validTo}</dd>
                  {result.serialNumber && (
                    <>
                      <dt style={{ color: "var(--text3)" }}>Serial</dt>
                      <dd style={{ margin: 0, color: "var(--text)", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>{result.serialNumber}</dd>
                    </>
                  )}
                </dl>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p className="section-label">Why this matters</p>
          <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Catch expiring certificates before users see a scary warning.</h2>
          <p style={{ color: "var(--text2)", lineHeight: 1.7 }}>
            A one-shot SSL check is great for a single domain. But if you have multiple sites or
            critical APIs, you want continuous monitoring with email/Slack alerts when expiry
            approaches. UptimeCrow checks your SSL daily and pages you 14–30 days before expiry.
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/register" className="hero-btn primary">Monitor SSL on 25 domains — free</Link>
          </div>
        </div>
      </section>
    </ToolsLayout>
  );
}
