import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MarketingNav } from "@/components/marketing-nav";
import "./Landing.css";
import { analytics } from "@/lib/analytics";
import { useAuthStore } from "@/lib/auth";
import { usePageMeta } from "@/lib/meta";
import { PLAN_CATALOG } from "@uptimecrow/shared";

const BRAND = "UptimeCrow";

const FAQ = [
  {
    q: "How does annual billing work?",
    a: "Annual plans are billed upfront for 10 months — you get 12 months of service. That's 2 months completely free. You can switch back to monthly at the end of your annual period.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Not yet. The Free plan is free forever — use it until you outgrow it, then upgrade. Refunds on paid plans are handled case-by-case within 14 days of purchase.",
  },
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Yes. Downgrades take effect at the end of your current billing period, so you keep the features you paid for. You can manage your subscription directly from the billing portal in Settings.",
  },
  {
    q: "How does billing work?",
    a: "Paid plans are billed through Polar. You can pay by card, PayPal, or supported crypto. Invoices are emailed automatically and are also available in the customer portal.",
  },
  {
    q: "What counts as a monitor?",
    a: "Each HTTP, TCP, or keyword check is one monitor. Heartbeat monitors are counted separately — they track your cron jobs and scheduled tasks.",
  },
  {
    q: "Do you offer annual discounts or a custom plan?",
    a: "Annual billing gives you 2 months free (see toggle above). For SSO, a DPA, a custom invoice, or more monitors than Pro allows, email support@uptimecrow.com and we'll sort it out.",
  },
  {
    q: "Can I self-host UptimeCrow?",
    a: "Yes. The core is AGPL-3.0 licensed and the entire stack runs on Docker Compose. See the README on GitHub for the self-host guide.",
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  usePageMeta({
    title: "UptimeCrow Pricing — Free Uptime Monitoring Plans",
    description:
      "Start free with 10 monitors. Upgrade to Indie ($9/mo) for 1-minute checks, 1-year history, and Slack/Discord alerts, or Pro ($29/mo) for 30-second checks and 100 monitors.",
    canonical: "https://uptimecrow.com/pricing",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "UptimeCrow",
      url: "https://uptimecrow.com",
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Uptime monitoring and status pages",
      operatingSystem: "Any (web, Docker)",
      description:
        "Developer-first uptime monitoring and status page platform. Monitor HTTP, TCP, and keyword endpoints; auto-create incidents; serve pre-rendered status pages that survive origin downtime; native MCP server for AI assistants.",
      offers: PLAN_CATALOG.map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: p.monthlyPrice,
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.monthlyPrice,
          priceCurrency: "USD",
          unitText: "MONTH",
        },
        description: p.desc,
        availability: "https://schema.org/InStock",
        category: p.plan === "free" ? "FreeTier" : "Subscription",
      })),
    },
  });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => { analytics.pricingViewed(); }, []);

  const ctaHref = isAuthenticated ? "/dashboard/settings" : "/register";

  return (
    <div className="landing">
      <MarketingNav />

      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Fair pricing, no lock-in</div>
          <h1>Simple pricing.<br /><span className="highlight">Pick a plan that fits.</span></h1>
          <p className="hero-sub">
            Start free forever. Upgrade when you need more monitors, faster checks, or a branded status page.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "2rem" }}>
            <span style={{ fontSize: "0.9rem", color: annual ? "var(--text3)" : "var(--text)", fontWeight: annual ? 400 : 600 }}>Monthly</span>
            <button
              type="button"
              onClick={() => setAnnual((v) => !v)}
              aria-label="Toggle annual billing"
              role="switch"
              aria-checked={annual}
              style={{
                position: "relative",
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                background: annual ? "var(--green)" : "var(--border)",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute",
                top: 3,
                left: annual ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                display: "block",
              }} />
            </button>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.9rem", color: annual ? "var(--text)" : "var(--text3)", fontWeight: annual ? 600 : 400 }}>Annual</span>
              {annual && (
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--green)",
                  background: "var(--green)18",
                  border: "1px solid var(--green)40",
                  borderRadius: 6,
                  padding: "2px 7px",
                  letterSpacing: "0.02em",
                }}>
                  2 months free
                </span>
              )}
            </span>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <div className="pricing-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {PLAN_CATALOG.map((plan) => {
              const isAnnualPaid = annual && plan.monthlyPrice > 0;
              const displayPrice = isAnnualPaid ? `$${plan.annualMonthlyPrice}` : plan.monthlyPrice === 0 ? "$0" : `$${plan.monthlyPrice}`;
              return (
                <div key={plan.plan} className={`price-card${plan.featured ? " featured" : ""}`}>
                  <p className="price-name">{plan.name}</p>
                  <p className="price-amount">
                    {displayPrice}
                    <span>/mo</span>
                  </p>
                  {isAnnualPaid && (
                    <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginTop: "-0.25rem", marginBottom: "0.5rem" }}>
                      billed ${plan.annualTotal}/yr
                    </p>
                  )}
                  <p className="price-desc">{plan.desc}</p>
                  <ul className="price-features">
                    {plan.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <Link
                    to={plan.plan === "free" ? "/register" : ctaHref}
                    className={`price-btn${plan.featured ? " featured-btn" : ""}`}
                    onClick={() => analytics.upgradeClicked(plan.name)}
                  >
                    {plan.plan === "free" ? "Get Started Free" : isAuthenticated ? "Upgrade Now" : "Get Started"}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Enterprise / Custom hook */}
          <div style={{
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.25rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "1.5rem 2rem",
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: "0.25rem" }}>
                Need more than Pro?
              </p>
              <p style={{ color: "var(--text2)", fontSize: "0.92rem", margin: 0 }}>
                More monitors, custom data retention, SSO, DPA, or a custom invoice — tell us what you need.
              </p>
            </div>
            <a
              href="mailto:support@uptimecrow.com?subject=Custom plan inquiry"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.4rem",
                borderRadius: "10px",
                border: "1.5px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--green)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--green)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
              }}
            >
              Contact us →
            </a>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Frequently asked</p>
          <h2 className="section-title">Before you commit.</h2>
          <div style={{ display: "grid", gap: "1rem", maxWidth: 760, margin: "2rem auto 0" }}>
            {FAQ.map((item) => (
              <details
                key={item.q}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1.1rem 1.3rem",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    listStyle: "none",
                  }}
                >
                  {item.q}
                </summary>
                <p style={{ marginTop: "0.8rem", color: "var(--text2)", lineHeight: 1.6, fontSize: "0.95rem" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Ready to know when you're down?</h2>
          <p>10 monitors, 5-min checks, forever free — or self-host unlimited. No credit card needed.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/login" className="hero-btn secondary">Log in</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/vs/betterstack">vs Betterstack</Link>
              <Link to="/vs/uptimerobot">vs UptimeRobot</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
