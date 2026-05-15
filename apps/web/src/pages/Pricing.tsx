import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./Landing.css";
import { analytics } from "@/lib/analytics";
import { useAuthStore } from "@/lib/auth";
import { usePageMeta } from "@/lib/meta";

const BRAND = "UptimeCrow";

interface PlanDef {
  name: string;
  monthlyPrice: number | null;
  annualMonthlyPrice: number | null;
  annualTotal: number | null;
  per: string;
  desc: string;
  features: string[];
  cta: string;
  featured: boolean;
}

const PLANS: PlanDef[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    annualTotal: 0,
    per: "/mo",
    desc: "For side projects and personal apps.",
    features: [
      "10 monitors",
      "1 status page",
      "1-minute check intervals",
      "3 heartbeat monitors",
      "Automatic incident management",
      "Slack, Discord & email alerts",
      "Uptime badge",
      "30-day history",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Indie",
    monthlyPrice: 12,
    annualMonthlyPrice: 10,
    annualTotal: 120,
    per: "/mo",
    desc: "For indie hackers and solo founders.",
    features: [
      "25 monitors",
      "3 status pages",
      "1-minute check intervals",
      "10 heartbeat monitors",
      "Custom domain",
      "API access",
      "2 team seats",
      "90-day history",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    annualMonthlyPrice: 24,
    annualTotal: 290,
    per: "/mo",
    desc: "For growing SaaS teams.",
    features: [
      "50 monitors",
      "10 status pages",
      "30-second check intervals",
      "25 heartbeat monitors",
      "Multi-region checks",
      "Custom domain",
      "3 team seats",
      "90-day history",
    ],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "Team",
    monthlyPrice: 79,
    annualMonthlyPrice: 66,
    annualTotal: 790,
    per: "/mo",
    desc: "For teams that ship fast.",
    features: [
      "Everything in Pro",
      "200 monitors",
      "100 heartbeat monitors",
      "10 team seats",
      "365-day history",
      "Priority support",
    ],
    cta: "Get Started",
    featured: false,
  },
];

const FAQ = [
  {
    q: "How does annual billing work?",
    a: "Annual plans are billed upfront for 10 months — you get 12 months of service. That's 2 months completely free. You can switch back to monthly at the end of your annual period.",
  },
  {
    q: "Is there a free trial for Pro or Team?",
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
    q: "What is multi-region monitoring?",
    a: "Pro and Team plans run checks from multiple geographic locations simultaneously. If only one region reports down, it's flagged as a regional issue. Only when a majority of regions agree does an incident open — drastically reducing false alarms.",
  },
  {
    q: "Do you offer annual discounts or an enterprise plan?",
    a: "Annual billing gives you 2 months free (see toggle above). For SSO, a DPA, a custom invoice, or more than 200 monitors, email support@uptimecrow.com.",
  },
  {
    q: "Can I self-host UptimeCrow?",
    a: "Yes. The core is MIT-licensed and the entire stack runs on Docker Compose. See the README on GitHub for the self-host guide.",
  },
];

export function Pricing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(false);

  usePageMeta({
    title: "UptimeCrow Pricing — Free Uptime Monitoring Plans",
    description:
      "Start free with 10 monitors and 1 status page. Upgrade to Indie ($12/mo), Pro ($29/mo), or Team ($79/mo) for more monitors, faster checks, and custom domains.",
    canonical: "https://uptimecrow.com/pricing",
  });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => { analytics.pricingViewed(); }, []);

  const ctaHref = isAuthenticated ? "/dashboard/settings" : "/register";

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
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register" className="nav-cta mobile-cta" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

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
          <div className="pricing-cards">
            {PLANS.map((plan) => {
              const isAnnualPaid = annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0;
              const displayPrice = isAnnualPaid ? `$${plan.annualMonthlyPrice}` : plan.monthlyPrice === 0 ? "$0" : `$${plan.monthlyPrice}`;
              return (
                <div key={plan.name} className={`price-card${plan.featured ? " featured" : ""}`}>
                  <p className="price-name">{plan.name}</p>
                  <p className="price-amount">
                    {displayPrice}
                    <span>{plan.per}</span>
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
                    to={plan.name === "Free" ? "/register" : ctaHref}
                    className={`price-btn${plan.featured ? " featured-btn" : ""}`}
                    onClick={() => analytics.upgradeClicked(plan.name)}
                  >
                    {plan.name === "Free" ? "Get Started" : isAuthenticated ? "Upgrade Now" : "Get Started"}
                  </Link>
                </div>
              );
            })}
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
          <p>10 monitors, 1-min checks, forever free. No credit card needed.</p>
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
