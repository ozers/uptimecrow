import { Link } from "react-router-dom";
import { ShieldCheck, Globe2, Activity } from "lucide-react";
import { ToolsLayout } from "./ToolsLayout";
import { usePageMeta } from "@/lib/meta";

const TOOLS = [
  {
    Icon: ShieldCheck,
    href: "/tools/ssl-checker",
    title: "SSL Certificate Checker",
    body: "Check any domain's SSL certificate expiry, issuer, and chain — no signup required. Get alerted before your cert expires.",
  },
  {
    Icon: Globe2,
    href: "/tools/dns-lookup",
    title: "DNS Lookup",
    body: "Resolve A, AAAA, MX, TXT, NS, and CNAME records for any hostname. Diagnose DNS issues in seconds.",
  },
  {
    Icon: Activity,
    href: "/tools/uptime-test",
    title: "Uptime Test",
    body: "Run a single HTTP check against any URL — see status code, response time, and detect common issues like soft 404s and slow responses.",
  },
];

export default function ToolsIndex() {
  usePageMeta({
    title: "Free Uptime & Web Tools — UptimeCrow",
    description:
      "Free developer tools: SSL certificate checker, DNS lookup, and uptime tester. No signup. Built by UptimeCrow, the open-source uptime monitoring platform.",
    canonical: "https://uptimecrow.com/tools",
  });

  return (
    <ToolsLayout>
      <section className="hero">
        <div className="container">
          <div className="hero-badge">● Free forever · No signup</div>
          <h1>Web tools that<br />actually work.</h1>
          <p className="hero-sub">
            Quick utilities for developers. Check SSL certificates, look up DNS records, and test
            uptime — all powered by the same engine that runs UptimeCrow's monitoring.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="features-grid">
            {TOOLS.map(({ Icon, href, title, body }) => (
              <Link
                key={href}
                to={href}
                className="feature"
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <Icon size={28} style={{ color: "var(--accent)", marginBottom: "0.5rem" }} />
                <h3>{title}</h3>
                <p>{body}</p>
                <p style={{ marginTop: "0.75rem", color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem" }}>
                  Use the tool →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Need ongoing monitoring?</h2>
          <p>UptimeCrow runs these checks on a schedule, opens incidents, and updates a status page automatically. Free for 10 monitors, or self-host unlimited.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/pricing" className="hero-btn secondary">See pricing</Link>
          </div>
        </div>
      </section>
    </ToolsLayout>
  );
}
