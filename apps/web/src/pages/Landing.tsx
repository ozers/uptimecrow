import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const BRAND = "UptimeCrow";

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= 10) clearInterval(interval);
          }, 300);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const lines = [
    { time: "03:14:22", content: <><span className="t-red">▼ DOWN</span> <span className="t-white">api.yourapp.com</span> <span className="t-dim">— HTTP 503, response timeout</span></> },
    { time: "03:14:25", content: <><span className="t-amber">● AI</span> <span className="t-dim">Incident created:</span> <span className="t-white">"API experiencing elevated error rates"</span></> },
    { time: "03:14:26", content: <><span className="t-amber">● AI</span> <span className="t-dim">Status page updated → investigating</span></> },
    { time: "03:14:30", content: <span className="t-dim">📧 47 subscribers notified via email</span> },
    { time: "03:14:31", content: <span className="t-dim">💬 Slack alert sent to #engineering</span> },
    { time: "03:31:07", content: <><span className="t-green">▲ UP</span> <span className="t-white">api.yourapp.com</span> <span className="t-dim">— 200 OK, 143ms</span></> },
    { time: "03:31:09", content: <><span className="t-green">● AI</span> <span className="t-dim">Incident resolved. Postmortem draft ready.</span></> },
    { time: "03:31:10", content: <span className="t-dim">📧 47 subscribers notified — resolved</span> },
    { time: "", content: null },
    { time: "", content: <><span className="t-dim">Total downtime:</span> <span className="t-white">16m 45s</span> <span className="t-dim">· Human intervention:</span> <span className="t-green">none</span></> },
  ];

  return (
    <div className="container">
      <div className="demo" ref={ref}>
        <div className="demo-bar">
          <div className="demo-dot r" />
          <div className="demo-dot a" />
          <div className="demo-dot g" />
          <span className="demo-title">incident-timeline.log</span>
        </div>
        <div className="demo-body">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`demo-line ${i < visibleLines ? "visible" : ""}`}
            >
              {line.content === null ? (
                <br />
              ) : (
                <>
                  {line.time && <span className="t-dim">{line.time}</span>}{" "}
                  {line.content}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-dot" />
            <span>{BRAND}</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link to="/login" className="nav-login">Log in</Link>
            <Link to="/register" className="nav-cta">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">● Now available — start monitoring in 3 minutes</div>
          <h1>Your site went down.<br /><span className="highlight">AI handled it.</span></h1>
          <p className="hero-sub">
            Downtime detected → AI writes the incident report → status page updated → subscribers notified. <strong>All before you wake up.</strong>
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <a href="#how" className="hero-btn secondary">See how it works</a>
          </div>
          <p className="form-note">Free tier forever. No credit card required.</p>
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <TerminalDemo />

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="container">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Three minutes to set up.<br />Zero minutes to manage.</h2>
          <p className="section-desc">Add your endpoints, customize your status page, go to sleep. We handle the rest.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Add your endpoints</h3>
              <p>HTTP, TCP, or webhook. We ping every 30 seconds from multiple regions. If it's down, we know in under a minute.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>AI manages incidents</h3>
              <p>Downtime detected → AI creates an incident, writes a clear status update, and posts it to your status page. No copy-pasting.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Subscribers stay informed</h3>
              <p>Email, Slack, webhook — your users know what's happening. When it's resolved, AI writes the postmortem draft.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Features</p>
          <h2 className="section-title">Everything you need.<br />Nothing you don't.</h2>
          <div className="features-grid">
            {[
              { icon: "🤖", title: "AI Incident Reports", desc: "When things go wrong, AI writes clear, professional incident updates — not generic \"we're investigating\" messages." },
              { icon: "📡", title: "Global Monitoring", desc: "HTTP, TCP, and webhook checks every 30s from multiple regions. Sub-minute detection, zero false positives." },
              { icon: "🎨", title: "Beautiful Status Pages", desc: "Hosted on your custom domain. Clean, fast, branded. Your users see a professional page — not a wall of technical jargon." },
              { icon: "📧", title: "Subscriber Notifications", desc: "Email and Slack alerts when incidents start and resolve. Your users subscribe themselves — zero friction." },
              { icon: "📝", title: "Postmortem Drafts", desc: "Incident resolved? AI drafts a postmortem with timeline, impact summary, and root cause template. Edit and publish." },
              { icon: "⏱️", title: "Uptime Badge", desc: "Embed a real-time \"99.98% uptime\" badge on your site, README, or docs. Social proof that builds trust." },
            ].map((f) => (
              <div className="feature" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Why switch</p>
          <h2 className="section-title">AI-native, not AI-added.</h2>
          <p className="section-desc">Most status page tools make you write incident updates manually. We built AI into the core — not as a checkbox feature.</p>
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th className="you">{BRAND}</th>
                <th>Betterstack</th>
                <th>Instatus</th>
                <th>Statuspage.io</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "AI incident reports", us: "✓ Auto-generated", bs: "✗", ins: "✗", sp: "✗" },
                { feature: "AI postmortem drafts", us: "✓ Auto-drafted", bs: "✗", ins: "✗", sp: "✗" },
                { feature: "Auto status page update", us: "✓", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
                { feature: "Uptime monitoring", us: "✓ 30s intervals", bs: "✓", ins: "✓", sp: "Add-on" },
                { feature: "Custom domain", us: "✓", bs: "✓", ins: "✓", sp: "✓" },
                { feature: "Free tier", us: "✓ Forever free", bs: "Trial only", ins: "✓", sp: "✗" },
                { feature: "Starting price", us: "$19/mo", bs: "$24/mo", ins: "$20/mo", sp: "$79/mo" },
              ].map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td className="you-col">{row.us.startsWith("✓") ? <><span className="check">✓</span>{row.us.slice(1)}</> : row.us}</td>
                  <td>{row.bs.startsWith("✗") ? <><span className="cross">✗</span>{row.bs.slice(1)}</> : row.bs.startsWith("✓") ? <><span className="check">✓</span>{row.bs.slice(1)}</> : row.bs}</td>
                  <td>{row.ins.startsWith("✗") ? <><span className="cross">✗</span>{row.ins.slice(1)}</> : row.ins.startsWith("✓") ? <><span className="check">✓</span>{row.ins.slice(1)}</> : row.ins}</td>
                  <td>{row.sp.startsWith("✗") ? <><span className="cross">✗</span>{row.sp.slice(1)}</> : row.sp.startsWith("✓") ? <><span className="check">✓</span>{row.sp.slice(1)}</> : row.sp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Start free. Scale when ready.</h2>
          <div className="pricing-cards">
            <div className="price-card">
              <p className="price-name">Free</p>
              <p className="price-amount">$0<span>/mo</span></p>
              <p className="price-desc">For side projects and personal apps.</p>
              <ul className="price-features">
                <li>1 status page</li>
                <li>3 monitors</li>
                <li>5-minute check intervals</li>
                <li>Manual incident management</li>
                <li>Email notifications</li>
                <li>Uptime badge</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started</Link>
            </div>
            <div className="price-card featured">
              <p className="price-name">Pro</p>
              <p className="price-amount">$19<span>/mo</span></p>
              <p className="price-desc">For growing SaaS teams.</p>
              <ul className="price-features">
                <li>3 status pages</li>
                <li>20 monitors</li>
                <li>30-second check intervals</li>
                <li>AI incident reports</li>
                <li>AI postmortem drafts</li>
                <li>Custom domain</li>
                <li>Slack + webhook alerts</li>
                <li>Uptime badge embed</li>
                <li>2 team seats</li>
              </ul>
              <Link to="/register" className="price-btn featured-btn">Get Started</Link>
            </div>
            <div className="price-card">
              <p className="price-name">Team</p>
              <p className="price-amount">$49<span>/mo</span></p>
              <p className="price-desc">For teams that ship fast.</p>
              <ul className="price-features">
                <li>Everything in Pro</li>
                <li>Unlimited status pages</li>
                <li>50 monitors</li>
                <li>Multi-region checks</li>
                <li>Team members (5 seats)</li>
                <li>API access</li>
                <li>Priority support</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Stop writing incident reports at 3 AM.</h2>
          <p>Start monitoring for free. Set up in under 3 minutes.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/login" className="hero-btn secondary">Log in</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
        </div>
      </footer>
    </div>
  );
}
