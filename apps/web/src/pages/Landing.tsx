import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/meta";
import {
  ShieldCheck,
  Radio,
  Heart,
  Palette,
  Mail,
  Zap,
  Bell,
  Timer,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import "./landing-redesign.css";

const BRAND = "UptimeCrow";
const GITHUB_URL = "https://github.com/uptimecrow";

// ─── Reactive hero ────────────────────────────────────────────────────────────
// A live monitor card where a random service dips red, the crow reacts (aura
// flashes red, a "!" badge pops, a little shake), an incident toast appears,
// then it resolves and recovers — looping. Honours prefers-reduced-motion.
const HERO_SERVICES = ["app.yourapp.com", "api.yourapp.com", "payments"];

function ReactiveHero() {
  const [down, setDown] = useState<number | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [shake, setShake] = useState(false);
  const [badge, setBadge] = useState("All systems operational");
  const [toast, setToast] = useState<{ text: string; kind: "red" | "green" } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    (async () => {
      while (alive) {
        await wait(3200);
        if (!alive) break;
        const i = Math.floor(Math.random() * HERO_SERVICES.length);
        setDown(i);
        setAlerting(true);
        setBadge("Incident detected");
        setShake(true);
        timers.push(setTimeout(() => alive && setShake(false), 500));
        setToast({ text: `🔴 ${HERO_SERVICES[i]} is down — incident opened`, kind: "red" });

        await wait(2400);
        if (!alive) break;
        setToast({ text: "✓ resolved · status page updated", kind: "green" });

        await wait(1100);
        if (!alive) break;
        setDown(null);
        setAlerting(false);
        setBadge("All systems operational");

        await wait(1600);
        if (!alive) break;
        setToast(null);
      }
    })();

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <section className="lp-hero">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <span className={`lp-badge${alerting ? " alert" : ""}`}>
            <span className="e" aria-hidden="true" />
            {badge}
          </span>
          <h1>
            Your site went down.
            <br />
            <span className="hl">We caught it first.</span>
          </h1>
          <p className="lp-sub">
            Open-source uptime monitoring &amp; status pages that earn trust. The crow watches
            every endpoint, opens the incident and updates your status page —{" "}
            <b>before your users notice.</b>
          </p>
          <div className="lp-actions">
            <Link to="/register" className="lp-btn primary">
              Start free — 10 monitors
            </Link>
            <a className="lp-btn ghost" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              ★ Star on GitHub
            </a>
          </div>
          <div className="lp-specs">
            <span>
              <b>HTTP · TCP · keyword · cron</b>
            </span>
            <span>
              self-host <b>unlimited</b>
            </span>
            <span>
              <b>MCP</b> server for AI
            </span>
          </div>
        </div>

        <div className="lp-stage">
          <div className={`lp-aura${alerting ? " alert" : ""}`} aria-hidden="true" />
          <div className={`lp-mascot-wrap${shake ? " react" : ""}`}>
            <img className="lp-mascot" src="/crow-mascot.png" alt="UptimeCrow crow mascot" />
            <div className="lp-glint" aria-hidden="true" />
            <div className={`lp-alert-badge${alerting ? " show" : ""}`} aria-hidden="true">
              !
            </div>
          </div>
          <div className="lp-live" aria-hidden="true">
            {HERO_SERVICES.map((s, i) => (
              <div key={s} className={`lp-live-row${down === i ? " down" : ""}`}>
                <span className="d" /> {s}{" "}
                <span className="st">{down === i ? "down" : "up"}</span>
              </div>
            ))}
          </div>
          <div
            className={`lp-toast ${toast?.kind ?? ""}${toast ? " show" : ""}`}
            role="status"
            aria-live="polite"
          >
            {toast?.text ?? ""}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ (kept for SEO / GEO — emitted as FAQPage JSON-LD) ─────────────────────
const FAQ_ITEMS = [
  {
    q: "What is UptimeCrow?",
    a: "UptimeCrow is a developer-first uptime monitoring and status page platform. It automatically monitors your APIs, websites, and cron jobs — creating incidents, updating your status page, and alerting subscribers the moment downtime is detected. No manual work needed.",
  },
  {
    q: "How is UptimeCrow different from UptimeRobot or BetterStack?",
    a: "UptimeCrow is the only uptime tool with a native MCP server (query your monitors from Claude or Cursor), pre-rendered status pages that survive origin downtime, and an AGPL-3.0 open-source core you can self-host. Free plan includes 10 monitors — BetterStack starts at $24/mo for serious use.",
  },
  {
    q: "How is UptimeCrow different from Uptime Kuma?",
    a: "Uptime Kuma is a great single-user self-hosted monitor. UptimeCrow is what you reach for when you outgrow it: multi-tenant orgs with teammates, status pages as a real product (custom domain, subscribers, pre-rendered to survive origin downtime), a full REST API, and a native MCP server — plus a managed cloud if you'd rather not run your own server. UptimeCrow is open source too (AGPL-3.0), so you can still self-host unlimited monitors for free.",
  },
  {
    q: "Is UptimeCrow really free? What's in the free plan?",
    a: "Yes — free forever, no credit card required. The free plan includes 10 monitors, 1 status page, 5-minute check intervals, 3 heartbeat monitors, email alerts, and 7-day history. Upgrade to Indie ($9/mo) for 1-minute checks, 1-year history, and Slack/Discord.",
  },
  {
    q: "What is heartbeat monitoring and cron job monitoring?",
    a: "Heartbeat monitoring (also called cron monitoring) tracks whether your scheduled jobs run on time. Your cron job or background worker pings a unique UptimeCrow URL on each successful run. If a ping is missed, UptimeCrow alerts you immediately. Available on all plans including free (3 heartbeats).",
  },
  {
    q: "How does UptimeCrow prevent false alarms?",
    a: "UptimeCrow uses a consecutive-failure state machine. By default, a monitor must fail 2 consecutive checks before an incident is created — a single network blip never pages your team. The confirmation count is configurable per monitor.",
  },
  {
    q: "Can I self-host UptimeCrow?",
    a: "Yes. UptimeCrow's full stack is AGPL-3.0 licensed and runs with a single docker compose up command. You bring PostgreSQL and Redis; we provide the code. No vendor lock-in, no data leaving your infrastructure.",
  },
  {
    q: "What is the MCP server and how does it work with Claude?",
    a: "UptimeCrow exposes a native MCP (Model Context Protocol) server. AI assistants — Claude Code, Cursor, Windsurf — can query your monitor status, list active incidents, and check heartbeat health without leaving the editor. Authenticate with an API key.",
  },
  {
    q: "How often does UptimeCrow check my websites and APIs?",
    a: "Every 5 minutes on Free, every 60 seconds on Indie, every 30 seconds on Pro. A configurable consecutive-failure confirmation means a single blip won't trigger a false incident.",
  },
  {
    q: "How do status pages stay online when my origin is down?",
    a: "UptimeCrow pre-renders your status page as static HTML on every incident update. The pre-rendered page is served completely decoupled from your origin. Even if your app, API, and database are all down, subscribers can still view your status page and incident updates.",
  },
];

const LANDING_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  return (
    <section className="lp-sec tight" id="faq">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-eyebrow">FAQ</div>
          <h2>Common questions.</h2>
        </div>
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div className="lp-faq-item" key={i}>
              <button className="lp-faq-q" onClick={() => toggle(i)} aria-expanded={open === i}>
                <span>{item.q}</span>
                <span className="lp-faq-icon" aria-hidden="true">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && <p className="lp-faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const COMPARISON = [
  { feature: "Auto incident creation", us: "✓ Automatic", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
  { feature: "Auto status page update", us: "✓ Automatic", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
  { feature: "Uptime monitoring", us: "✓ 5min free, 30s Pro", bs: "✓ 3-min free", ins: "✓ 2-min free", sp: "Add-on" },
  { feature: "Free monitors", us: "✓ 10 free forever", bs: "✓ 10 free", ins: "✓ 15 free", sp: "✗ None" },
  { feature: "Subscriber notifications", us: "✓ Email + Slack", bs: "✓", ins: "✓", sp: "✓" },
  { feature: "Heartbeat monitoring", us: "✓ All plans (3 free)", bs: "✓ Paid only", ins: "✗", sp: "✗" },
  { feature: "MCP server (AI assistants)", us: "✓ Native", bs: "✗", ins: "✗", sp: "✗" },
  { feature: "PagerDuty + Teams + Telegram", us: "✓ Built-in", bs: "✓ Paid", ins: "✗ Partial", sp: "✓ Enterprise" },
  { feature: "Incident templates", us: "✓ 9 templates", bs: "✗", ins: "✗", sp: "✓" },
  { feature: "False positive prevention", us: "✓ Multi-check", bs: "✓", ins: "✗", sp: "✗" },
  { feature: "Starting price", us: "$9/mo (Indie)", bs: "$24/mo", ins: "$20/mo", sp: "$79/mo" },
];

function cmpCell(v: string) {
  if (v.startsWith("✓")) return <><span className="check">✓</span>{v.slice(1)}</>;
  if (v.startsWith("✗")) return <><span className="cross">✗</span>{v.slice(1)}</>;
  return v;
}

const PLANS = [
  { name: "Free", price: "$0", desc: "For side projects and personal apps.", features: ["1 status page", "10 monitors", "5-minute check intervals", "3 heartbeat monitors", "Email alerts", "Uptime badge", "7-day history"] },
  { name: "Indie", price: "$9", desc: "For indie hackers and solo founders.", features: ["5 status pages + custom domain", "25 monitors", "1-minute check intervals", "10 heartbeat monitors", "Slack, Discord, API access", "1-year history"] },
  { name: "Pro", price: "$29", desc: "For growing SaaS teams.", popular: true, features: ["10 status pages", "100 monitors", "30-second check intervals", "25 heartbeat monitors", "Custom domain + API access", "5 team seats", "1-year history"] },
  { name: "Team", price: "$79", desc: "For teams that ship fast.", features: ["Everything in Pro", "200 monitors", "100 heartbeat monitors", "10 team seats", "1-year history"] },
];

// ─── Landing page ──────────────────────────────────────────────────────────────
export function LandingPage() {
  usePageMeta({
    title: "UptimeCrow — Free, Open-Source Uptime Monitoring & Status Pages",
    description:
      "Free uptime monitoring for developers — open source and self-hostable. Monitor APIs, websites, and cron jobs. Auto incidents, status page updates, and subscriber alerts. 10 monitors free, or self-host unlimited.",
    canonical: "https://uptimecrow.com/",
    jsonLd: LANDING_FAQ_LD,
  });

  return (
    <div className="lp">
      {/* NAV */}
      <MarketingNav />

      {/* HERO (reactive) */}
      <ReactiveHero />

      {/* TRUST STRIP */}
      <div className="lp-strip">
        <div className="lp-wrap lp-strip-inner">
          <span>
            <span className="s">★</span> Open source on GitHub
          </span>
          <span>
            <b>AGPL-3.0</b> — self-host free
          </span>
          <span>
            one <b>docker compose up</b>
          </span>
          <span>
            up in <b>3 minutes</b>
          </span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="lp-sec" id="how">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-eyebrow">How it works</div>
            <h2>Set it once. The crow does the rest.</h2>
            <p className="lp-lead">No dashboards to babysit. Add your endpoints and go back to building.</p>
          </div>
          <div className="lp-flow">
            <div className="lp-flow-step">
              <div className="lp-flow-num">1</div>
              <h3>Add your endpoints</h3>
              <p>HTTP, TCP, keyword or cron checks — at the interval you choose, as often as every 30 seconds.</p>
            </div>
            <div className="lp-flow-step">
              <div className="lp-flow-num">2</div>
              <h3>The crow watches</h3>
              <p>A blip is confirmed, not panicked over. On a real outage it opens an incident and updates your status page instantly.</p>
            </div>
            <div className="lp-flow-step">
              <div className="lp-flow-num">3</div>
              <h3>You get pinged</h3>
              <p>Email, Slack, Discord, PagerDuty, Telegram — or just ask Claude “is anything down?” via the MCP server.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-sec tight" id="features">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-eyebrow">Everything you need</div>
            <h2>Monitoring, status pages, on-call — one tool.</h2>
          </div>
          <div className="lp-bento">
            {/* Featured: MCP — the differentiator, with a mini terminal */}
            <div className="b feature">
              <div className="b-ic">
                <Zap size={20} aria-hidden="true" />
              </div>
              <h3>MCP server for AI</h3>
              <p>
                Query monitors &amp; incidents straight from Claude, Cursor or Windsurf — the only
                uptime tool with a native MCP server.
              </p>
              <div className="b-term" aria-hidden="true">
                <div className="b-term-bar">
                  <i /><i /><i />
                </div>
                <div className="b-term-body">
                  <div className="b-term-in">
                    <span className="p">claude ›</span> is my API up?
                  </div>
                  <div className="b-term-out">✓ all 4 monitors up — api 88ms · last incident 12d ago</div>
                </div>
              </div>
            </div>

            <div className="b">
              <div className="b-ic"><Radio size={20} aria-hidden="true" /></div>
              <h3>Uptime monitoring</h3>
              <p>HTTP, TCP &amp; keyword checks as often as every 30 seconds, with confirmation that kills false alarms.</p>
            </div>

            <div className="b">
              <div className="b-ic"><Heart size={20} aria-hidden="true" /></div>
              <h3>Heartbeat monitoring</h3>
              <p>Cron jobs ping a unique URL — miss one and the crow squawks. On every plan.</p>
            </div>

            <div className="b">
              <div className="b-ic"><ShieldCheck size={20} aria-hidden="true" /></div>
              <h3>Auto incident detection</h3>
              <p>A real outage opens an incident and updates your status page — no human in the loop.</p>
            </div>

            {/* Wide: alerts everywhere, with channel chips */}
            <div className="b wide">
              <div className="b-ic"><Mail size={20} aria-hidden="true" /></div>
              <h3>Alerts everywhere</h3>
              <p>Incident start &amp; resolve pushed to every channel your team already lives in.</p>
              <div className="b-chips">
                <span>Email</span>
                <span>Slack</span>
                <span>Discord</span>
                <span>PagerDuty</span>
                <span>Teams</span>
                <span>Telegram</span>
              </div>
            </div>

            <div className="b">
              <div className="b-ic"><Palette size={20} aria-hidden="true" /></div>
              <h3>Beautiful status pages</h3>
              <p>Branded, on your domain, pre-rendered so they stay up even when your origin is down.</p>
            </div>

            <div className="b">
              <div className="b-ic"><Bell size={20} aria-hidden="true" /></div>
              <h3>Incident templates</h3>
              <p>Nine pre-written templates — one click fills the title and update body. Comms in seconds.</p>
            </div>

            <div className="b">
              <div className="b-ic"><Timer size={20} aria-hidden="true" /></div>
              <h3>Uptime badge</h3>
              <p>Drop a live uptime badge in your README or docs — social proof that updates itself.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATUS PAGE SHOWCASE */}
      <section className="lp-showcase lp-sec">
        <div className="lp-wrap lp-show-grid">
          <div>
            <div className="lp-eyebrow">Your public face</div>
            <h2>A status page your users actually trust.</h2>
            <p className="lp-lead">
              Custom domain, branded, with subscribers — and it survives the one moment that
              matters: when you're down.
            </p>
            <div style={{ marginTop: "24px" }}>
              <Link to="/register" className="lp-btn primary">
                Create your status page
              </Link>
            </div>
          </div>
          <div className="lp-panel">
            <div className="lp-panel-bar">
              <i className="r" />
              <i className="y" />
              <i className="g" />
              <span>status.yourapp.com</span>
            </div>
            <div className="lp-panel-body">
              <div className="lp-op">
                <span className="d" />
                <span className="t">All systems operational</span>
                <span className="m">99.98%</span>
              </div>
              <div className="lp-srow">
                <span className="ck">✓</span> app.yourapp.com <span className="up">99.99%</span>
                <span className="ms">142ms</span>
              </div>
              <div className="lp-srow">
                <span className="ck">✓</span> api.yourapp.com <span className="up">100%</span>
                <span className="ms">88ms</span>
              </div>
              <div className="lp-srow">
                <span className="ck">✓</span> auth.yourapp.com <span className="up">99.94%</span>
                <span className="ms">203ms</span>
              </div>
              <div className="lp-srow">
                <span className="ck">✓</span> payments <span className="up">99.99%</span>
                <span className="ms">176ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON (kept for SEO/GEO) */}
      <section className="lp-sec tight">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-eyebrow">Why switch</div>
            <h2>Simple, affordable, and complete.</h2>
            <p className="lp-lead">
              Most status-page tools charge enterprise prices for features you actually need.
              UptimeCrow gives you monitoring, status pages and notifications — without the bloat.
            </p>
          </div>
          <div className="lp-cmp-scroll">
            <table className="lp-cmp">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col" className="you">{BRAND}</th>
                  <th scope="col">BetterStack</th>
                  <th scope="col">Instatus</th>
                  <th scope="col">Statuspage.io</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td className="you-col">{cmpCell(row.us)}</td>
                    <td>{cmpCell(row.bs)}</td>
                    <td>{cmpCell(row.ins)}</td>
                    <td>{cmpCell(row.sp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* PRICING */}
      <section className="lp-sec tight" id="pricing">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-eyebrow">Pricing</div>
            <h2>Start free. Self-host for free, forever.</h2>
            <p className="lp-lead">
              The hosted tier gets you going in minutes; the open-source core is yours, unlimited.
            </p>
          </div>
          <div className="lp-price">
            {PLANS.map((plan) => (
              <div className={`lp-pcard${plan.popular ? " pop" : ""}`} key={plan.name}>
                {plan.popular && <span className="pop-tag">POPULAR</span>}
                <p className="pn">{plan.name}</p>
                <p className="pp">
                  {plan.price}
                  <span>/mo</span>
                </p>
                <p className="pd">{plan.desc}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`lp-pbtn${plan.popular ? " pop" : ""}`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final">
        <div className="lp-wrap">
          <img className="mini" src="/crow-mascot.png" alt="" aria-hidden="true" />
          <h2>Let the crow take the night shift.</h2>
          <p className="lp-lead" style={{ margin: "14px auto 0" }}>
            Free for 10 monitors. Self-host unlimited. Up and running in 3 minutes.
          </p>
          <div className="lp-actions" style={{ justifyContent: "center", marginTop: "28px" }}>
            <Link to="/register" className="lp-btn primary">
              Get started free
            </Link>
            <Link to="/login" className="lp-btn ghost">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-foot-top">
            <div className="lp-foot-brand">
              <img src="/logo.svg" alt="UptimeCrow logo" />
              <span>{BRAND}</span>
            </div>
            <div className="lp-foot-cols">
              <div className="lp-foot-col">
                <span className="lbl">Product</span>
                <a href="#features">Features</a>
                <Link to="/pricing">Pricing</Link>
                <Link to="/docs">API Docs</Link>
                <Link to="/mcp">MCP Server</Link>
              </div>
              <div className="lp-foot-col">
                <span className="lbl">Compare</span>
                <Link to="/vs/betterstack">vs BetterStack</Link>
                <Link to="/vs/uptimerobot">vs UptimeRobot</Link>
                <Link to="/vs/uptime-kuma">vs Uptime Kuma</Link>
                <Link to="/vs/freshping">vs Freshping</Link>
                <Link to="/vs/instatus">vs Instatus</Link>
              </div>
              <div className="lp-foot-col">
                <span className="lbl">Legal</span>
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className="lp-foot-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="lp-foot-links">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <Link to="/login">Log in</Link>
              <Link to="/register">Get started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
