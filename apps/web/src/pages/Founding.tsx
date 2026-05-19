import { Link } from "react-router-dom";
import "./Landing.css";
import { usePageMeta } from "@/lib/meta";
import { MarketingLayout } from "@/components/layout/MarketingLayout";

const BRAND = "UptimeCrow";

interface LifetimePlan {
  name: string;
  oneTimePrice: number;
  normalMonthly: number;
  annualEquiv: number;
  desc: string;
  features: string[];
  featured: boolean;
  badge: string;
}

const LIFETIME_PLANS: LifetimePlan[] = [
  {
    name: "Indie Lifetime",
    oneTimePrice: 99,
    normalMonthly: 12,
    annualEquiv: 144,
    desc: "Perfect for indie hackers and solo founders.",
    badge: "INDIE",
    features: [
      "30 monitors",
      "3 status pages",
      "1-minute check intervals",
      "10 heartbeat monitors",
      "Custom domain",
      "API access",
      "2 team seats",
      "90-day history",
      "All future updates included",
    ],
    featured: false,
  },
  {
    name: "Pro Lifetime",
    oneTimePrice: 199,
    normalMonthly: 29,
    annualEquiv: 348,
    desc: "For growing SaaS teams that need speed and scale.",
    badge: "PRO",
    features: [
      "50 monitors",
      "10 status pages",
      "30-second check intervals",
      "25 heartbeat monitors",
      "Multi-region checks",
      "Custom domain",
      "3 team seats",
      "90-day history",
      "All future updates included",
    ],
    featured: true,
  },
];

const FAQ = [
  {
    q: 'What exactly does "lifetime" mean?',
    a: `One payment, permanent access on the cloud-hosted ${BRAND} service — including all future updates. If we ever shut down (unlikely, but we keep it real: it's MIT-licensed), you keep the full source code and can self-host forever. You're never left with nothing.`,
  },
  {
    q: "Can I upgrade from Indie Lifetime to Pro Lifetime later?",
    a: "Yes. Email support@uptimecrow.com and you'll pay just the $100 difference. We'll move your account up to Pro Lifetime immediately.",
  },
  {
    q: "Is there a refund policy?",
    a: "14-day no-questions-asked refund, processed through Polar. If it's not right for you, we'll make it right.",
  },
  {
    q: "Why are you offering lifetime deals?",
    a: "We're pre-scale. Early supporters help us grow the user base, close that initial traction gap, and build something sustainable. We reward that with the best price you'll ever see on UptimeCrow — permanently.",
  },
  {
    q: "What if I already have a monthly plan?",
    a: "Cancel your subscription first (it stays active until the period ends), then purchase the lifetime plan. Your account, monitors, status pages, and history all stay intact.",
  },
];

const FOUNDING_NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Pricing", to: "/pricing" },
];

const FOUNDING_FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Pricing", to: "/pricing" },
  { label: "vs BetterStack", to: "/vs/betterstack" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Log in", to: "/login" },
];

export function Founding() {
  usePageMeta({
    title: `${BRAND} Founding Member — Lifetime Deal`,
    description:
      "Pay once, monitor forever. UptimeCrow founding member lifetime plans starting at $99. Limited to 250 spots. No subscription, no renewal anxiety — ever.",
    canonical: "https://uptimecrow.com/founding",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${BRAND} Founding Member Lifetime Deal`,
      url: "https://uptimecrow.com/founding",
      description:
        "Limited lifetime deal for the first 250 UptimeCrow founding members. Pay once, access forever.",
    },
  });

  return (
    <MarketingLayout navLinks={FOUNDING_NAV_LINKS} footerLinks={FOUNDING_FOOTER_LINKS}>
      {/* ── Hero ── */}
      <section className="hero" style={{ paddingBottom: "2.5rem" }}>
        <div className="container">
          {/* Scarcity badge */}
          <div className="hero-badge">
            ● 250 founding member spots — one-time only
          </div>

          <h1>
            Pay once.<br />
            <span className="highlight">Monitor forever.</span>
          </h1>

          <p className="hero-sub">
            Subscription pricing feels unfair for an open-source tool you can
            also self-host. So we're offering a founding member lifetime deal —
            one payment, no renewals, no anxiety. Ever.
          </p>

          {/* Urgency note */}
          <p
            style={{
              display: "inline-block",
              fontFamily: "var(--mono)",
              fontSize: "0.78rem",
              color: "var(--amber)",
              background: "rgba(255,171,64,0.10)",
              border: "1px solid rgba(255,171,64,0.20)",
              borderRadius: 8,
              padding: "0.4rem 1rem",
              marginBottom: "2.5rem",
            }}
          >
            ⚡ Once these 250 slots are gone, lifetime pricing is gone for good.
          </p>
        </div>
      </section>

      {/* ── Lifetime plan cards ── */}
      <section className="section" style={{ paddingTop: "0.5rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.25rem",
              maxWidth: 740,
              margin: "0 auto",
            }}
          >
            {LIFETIME_PLANS.map((plan) => {
              const savings = plan.annualEquiv - plan.oneTimePrice;
              const breakEvenMonths = Math.ceil(plan.oneTimePrice / plan.normalMonthly);
              return (
                <div
                  key={plan.name}
                  className={`price-card${plan.featured ? " featured" : ""}`}
                  style={
                    plan.featured
                      ? {
                          boxShadow:
                            "0 0 0 1px var(--green), 0 8px 32px rgba(0,230,118,0.08)",
                        }
                      : {}
                  }
                >
                  {/* Plan badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <p className="price-name">{plan.name}</p>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "var(--green)",
                        background: "var(--green-dim)",
                        border: "1px solid rgba(0,230,118,0.2)",
                        borderRadius: 4,
                        padding: "0.15rem 0.5rem",
                        letterSpacing: "0.08em",
                      }}
                    >
                      LIFETIME
                    </span>
                  </div>

                  {/* Price */}
                  <p className="price-amount">
                    ${plan.oneTimePrice}
                    <span> one-time</span>
                  </p>

                  {/* Savings callout */}
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text3)",
                      marginTop: "-0.2rem",
                      marginBottom: "0.3rem",
                    }}
                  >
                    vs ${plan.normalMonthly}/mo subscription
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--green)",
                      fontWeight: 600,
                      marginBottom: "0.9rem",
                    }}
                  >
                    Pays for itself in {breakEvenMonths} months · saves ${savings}/yr after that
                  </p>

                  <p className="price-desc">{plan.desc}</p>

                  <ul className="price-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>

                  <a
                    href="#polar-checkout"
                    className={`price-btn${plan.featured ? " featured-btn" : ""}`}
                    style={{ marginTop: "1.5rem" }}
                  >
                    Claim {plan.badge} Lifetime — ${plan.oneTimePrice}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Reassurance strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
              marginTop: "2rem",
            }}
          >
            {[
              "14-day refund via Polar",
              "No recurring charges",
              "MIT-licensed source",
              "All future updates",
            ].map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.72rem",
                  color: "var(--text3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why lifetime / value prop ── */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: "3rem" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              maxWidth: 860,
              margin: "0 auto",
            }}
          >
            {[
              {
                icon: "🔒",
                title: "No subscription anxiety",
                body: "Monthly billing means you're always one cancellation away from losing your monitoring. Lifetime means it's yours — full stop.",
              },
              {
                icon: "🌍",
                title: "Self-host or cloud — your call",
                body: `${BRAND} is MIT-licensed. If you prefer the cloud-hosted version, the lifetime deal covers that. If you prefer Docker Compose on your own VPS, the code is already yours free.`,
              },
              {
                icon: "🚀",
                title: "Future features included",
                body: "All major features we ship — new integrations, check types, dashboard improvements — are included at no extra cost. You're a founding member, not a trial user.",
              },
              {
                icon: "🤝",
                title: "You help us grow",
                body: "We're pre-scale. Lifetime members give us the early revenue to invest in infrastructure, improve the product, and keep it free for hobbyists. This is symbiotic.",
              },
            ].map((card) => (
              <div key={card.title} className="feature">
                <div className="feature-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included callout ── */}
      <section
        className="section"
        style={{
          paddingTop: 0,
          paddingBottom: "3rem",
        }}
      >
        <div className="container">
          <div
            style={{
              maxWidth: 700,
              margin: "0 auto",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "2rem 2.5rem",
            }}
          >
            <p className="section-label">What you get</p>
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
              Everything. Forever.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem 2rem",
              }}
            >
              {[
                "HTTP, TCP & keyword monitors",
                "Custom status pages",
                "Heartbeat / cron monitoring",
                "Slack, Discord & email alerts",
                "Incident management",
                "API access",
                "Uptime badges",
                "Maintenance windows",
                "30-second checks (Pro)",
                "Multi-region (Pro)",
                "On-call schedules",
                "MCP server for AI assistants",
              ].map((feat) => (
                <div
                  key={feat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "var(--text2)",
                    padding: "0.3rem 0",
                  }}
                >
                  <span style={{ color: "var(--green)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Got questions?</p>
          <h2 className="section-title">Before you commit.</h2>
          <div
            style={{
              display: "grid",
              gap: "1rem",
              maxWidth: 760,
              margin: "2rem auto 0",
            }}
          >
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
                <p
                  style={{
                    marginTop: "0.8rem",
                    color: "var(--text2)",
                    lineHeight: 1.6,
                    fontSize: "0.95rem",
                  }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="final-cta">
        <div className="container">
          <div
            style={{
              display: "inline-block",
              fontFamily: "var(--mono)",
              fontSize: "0.72rem",
              color: "var(--green)",
              background: "var(--green-dim)",
              border: "1px solid rgba(0,230,118,0.15)",
              borderRadius: 20,
              padding: "0.3rem 0.8rem",
              marginBottom: "1.5rem",
            }}
          >
            ● 250 spots total — once they're gone, they're gone
          </div>
          <h2>Ready to monitor forever?</h2>
          <p>One payment. No renewals. Full access — starting today.</p>
          <div className="hero-actions">
            <a href="#polar-checkout" className="hero-btn primary">
              Claim Indie Lifetime — $99
            </a>
            <a href="#polar-checkout" className="hero-btn secondary">
              Claim Pro Lifetime — $199
            </a>
          </div>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.78rem",
              color: "var(--text3)",
            }}
          >
            Questions?{" "}
            <a
              href="mailto:support@uptimecrow.com"
              style={{ color: "var(--text2)", textDecoration: "underline" }}
            >
              support@uptimecrow.com
            </a>{" "}
            · 14-day refund via Polar · Billing by{" "}
            <a
              href="https://polar.sh"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text2)", textDecoration: "underline" }}
            >
              Polar
            </a>
          </p>
          <div style={{ marginTop: "2rem" }}>
            <Link to="/pricing" style={{ fontSize: "0.82rem", color: "var(--text3)" }}>
              Looking for a monthly plan instead? →
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
