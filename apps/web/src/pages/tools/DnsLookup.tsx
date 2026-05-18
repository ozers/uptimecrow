import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe2, Loader2 } from "lucide-react";
import { ToolsLayout } from "./ToolsLayout";
import { usePageMeta } from "@/lib/meta";

type RecordType = "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME";

interface MxRecord {
  exchange: string;
  priority: number;
}

interface DnsResult {
  hostname: string;
  recordType: RecordType;
  records: string[] | MxRecord[];
  error?: string;
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.25rem 1.5rem",
};

const RECORD_TYPES: RecordType[] = ["A", "AAAA", "MX", "TXT", "NS", "CNAME"];

export default function DnsLookup() {
  const [hostname, setHostname] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Free DNS Lookup Tool — UptimeCrow",
    description:
      "Resolve A, AAAA, MX, TXT, NS, and CNAME records for any hostname. Free, instant DNS lookup. Built by UptimeCrow.",
    canonical: "https://uptimecrow.com/tools/dns-lookup",
  });

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!hostname.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/dns-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: hostname.trim(), recordType }),
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

  return (
    <ToolsLayout>
      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Free DNS Tool</div>
          <h1>DNS Lookup</h1>
          <p className="hero-sub">
            Resolve A, AAAA, MX, TXT, NS, and CNAME records for any hostname. Useful for debugging
            propagation, MX setup, SPF/DKIM records, and domain transfers.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <form onSubmit={run} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <label htmlFor="dns-host" style={{ fontWeight: 600, color: "var(--text)" }}>
              Hostname
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                id="dns-host"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="example.com"
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
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as RecordType)}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "1rem",
                }}
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading}
                className="hero-btn primary"
                style={{ minWidth: 120 }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Look Up"}
              </button>
            </div>
            <p style={{ color: "var(--text3)", fontSize: "0.85rem", margin: 0 }}>
              Limit: 10 lookups per minute per IP.
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
                <Globe2 size={24} style={{ color: "var(--accent)" }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--text)" }}>
                    {result.hostname}
                  </p>
                  <p style={{ margin: 0, color: "var(--text3)", fontSize: "0.85rem" }}>
                    {result.recordType} records · {Array.isArray(result.records) ? result.records.length : 0} found
                  </p>
                </div>
              </div>

              {result.error && (
                <p style={{ color: "var(--text3)", margin: 0 }}>{result.error}</p>
              )}

              {Array.isArray(result.records) && result.records.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {result.records.map((rec, i) => (
                    <li
                      key={i}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "0.6rem 0.85rem",
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "0.88rem",
                        color: "var(--text)",
                        wordBreak: "break-all",
                      }}
                    >
                      {typeof rec === "string"
                        ? rec
                        : `${(rec as MxRecord).priority}  ${(rec as MxRecord).exchange}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p className="section-label">Why this matters</p>
          <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Spot misconfigured DNS before users do.</h2>
          <p style={{ color: "var(--text2)", lineHeight: 1.7 }}>
            DNS misconfigurations cause silent failures — emails bouncing, subdomains returning
            wrong content, SPF records breaking deliverability. A one-shot lookup helps right now;
            ongoing monitoring catches the moment something changes.
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/register" className="hero-btn primary">Get continuous monitoring — free</Link>
          </div>
        </div>
      </section>
    </ToolsLayout>
  );
}
