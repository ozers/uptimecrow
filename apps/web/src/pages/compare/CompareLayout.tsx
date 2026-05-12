import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Check, Minus } from "lucide-react";
import "../Landing.css";

const BRAND = "UptimeCrow";

interface Row {
  feature: string;
  us: string | boolean;
  them: string | boolean;
  note?: string;
}

interface Props {
  competitor: string;
  competitorShort: string;
  headline: ReactNode;
  subhead: ReactNode;
  pitch: ReactNode;
  whyUs: { title: string; body: string }[];
  rows: Row[];
  whenThem: ReactNode;
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="check">✓</span>;
  if (value === false) return <Minus size={14} style={{ color: "var(--text3)" }} />;
  if (typeof value === "string" && value.startsWith("✓")) {
    return <><Check size={14} style={{ color: "var(--green)", marginRight: 4, verticalAlign: "middle" }} />{value.slice(1).trim()}</>;
  }
  if (typeof value === "string" && value.startsWith("✗")) {
    return <><X size={14} style={{ color: "var(--red)", marginRight: 4, verticalAlign: "middle" }} />{value.slice(1).trim()}</>;
  }
  return <>{value}</>;
}

export function CompareLayout(props: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { competitor, competitorShort, headline, subhead, pitch, whyUs, rows, whenThem } = props;

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
          <div className="hero-badge">● {BRAND} vs {competitor}</div>
          <h1>{headline}</h1>
          <p className="hero-sub">{subhead}</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Try {BRAND} free</Link>
            <Link to="/pricing" className="hero-btn secondary">See pricing</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <div style={{ maxWidth: 760, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7, color: "var(--text2)" }}>
            {pitch}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Side-by-side</p>
          <h2 className="section-title">{BRAND} vs {competitorShort}.</h2>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col" className="you">{BRAND}</th>
                  <th scope="col">{competitorShort}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature}>
                    <td>
                      {row.feature}
                      {row.note && (
                        <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text3)", marginTop: 2 }}>{row.note}</span>
                      )}
                    </td>
                    <td className="you-col"><Cell value={row.us} /></td>
                    <td><Cell value={row.them} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Why teams switch</p>
          <h2 className="section-title">What you get with {BRAND}.</h2>
          <div className="features-grid">
            {whyUs.map((item) => (
              <div className="feature" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ maxWidth: 760, margin: "0 auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.8rem" }}>
            <p className="section-label" style={{ margin: 0 }}>Honest take</p>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.5rem 0 0.75rem", color: "var(--text)" }}>When {competitorShort} is the better call</h3>
            <div style={{ fontSize: "0.95rem", color: "var(--text2)", lineHeight: 1.7 }}>
              {whenThem}
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Try {BRAND} free — 10 monitors, forever.</h2>
          <p>No credit card. If it fits, upgrade in one click. If not, delete your account in Settings.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/pricing" className="hero-btn secondary">See full pricing</Link>
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
              <Link to="/vs/betterstack">vs BetterStack</Link>
              <Link to="/vs/uptimerobot">vs UptimeRobot</Link>
              <Link to="/vs/uptime-kuma">vs Uptime Kuma</Link>
              <Link to="/vs/freshping">vs Freshping</Link>
              <Link to="/vs/instatus">vs Instatus</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
