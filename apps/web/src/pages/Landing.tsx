import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/meta";
import {
  ShieldCheck,
  Radio,
  Palette,
  Mail,
  Globe,
  Users,
  Bell,
  Timer,
  Check,
  X,
} from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";

const BRAND = "UptimeCrow";
const GITHUB_URL = "https://github.com/ozers/uptimecrow";

// ─── Reactive hero ────────────────────────────────────────────────────────────
// A live status demo card where a random service dips down, an incident toast
// appears, then it resolves and recovers — looping. Honours reduced-motion.
const HERO_SERVICES = ["app.yourapp.com", "api.yourapp.com", "payments"];

function ReactiveHero() {
  const [down, setDown] = useState<number | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [badge, setBadge] = useState("All systems operational");
  const [toast, setToast] = useState<{ text: string; kind: "down" | "up" } | null>(null);

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
        setToast({ text: `${HERO_SERVICES[i]} is down — incident opened`, kind: "down" });

        await wait(2400);
        if (!alive) break;
        setToast({ text: "resolved · status page updated", kind: "up" });

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
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        {/* Copy */}
        <div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              alerting
                ? "border-danger/30 bg-danger/10 text-danger-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                alerting ? "bg-danger" : "bg-success"
              }`}
            />
            {badge}
          </span>

          <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance sm:text-[54px]">
            Open-source status pages{" "}
            <span className="text-brand">that stay up when you&apos;re down.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
            Built-in uptime monitoring, automatic incidents, email subscribers and custom domains.
            Your status page is pre-rendered, so it keeps answering{" "}
            <span className="font-semibold text-foreground">even when everything else doesn&apos;t.</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">Create your status page — free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                ★ Star on GitHub
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
            <span>
              <span className="text-foreground">HTTP · TCP · keyword</span> checks
            </span>
            <span className="hidden sm:inline text-border">/</span>
            <span>
              self-host <span className="text-foreground">unlimited</span> (AGPL)
            </span>
            <span className="hidden sm:inline text-border">/</span>
            <span>
              or <span className="text-foreground">hosted</span>, free tier
            </span>
          </div>
        </div>

        {/* Live status demo card */}
        <div className="relative">
          <img
            src="/crow-mascot.png"
            alt="UptimeCrow crow mascot"
            className="pointer-events-none absolute -right-4 -top-16 z-10 hidden h-40 w-40 select-none drop-shadow-xl lg:block"
          />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                status.yourapp.com
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      alerting ? "bg-danger" : "bg-success"
                    }`}
                  />
                  {alerting ? "Incident in progress" : "All systems operational"}
                </span>
                <span className="font-mono text-sm tnum text-muted-foreground">99.98%</span>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                {HERO_SERVICES.map((s, i) => {
                  const isDown = down === i;
                  return (
                    <div
                      key={s}
                      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isDown ? "bg-danger" : "bg-success"
                        }`}
                      />
                      <span className="font-mono text-[13px] text-foreground">{s}</span>
                      <span
                        className={`ml-auto font-mono text-[11px] uppercase tracking-wide ${
                          isDown ? "text-danger-foreground" : "text-success-foreground"
                        }`}
                      >
                        {isDown ? "down" : "up"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 font-mono text-[12px] transition-all duration-300 ${
                  toast
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none translate-y-1 opacity-0"
                } ${
                  toast?.kind === "down"
                    ? "border-danger/30 bg-danger/10 text-danger-foreground"
                    : "border-success/30 bg-success/10 text-success-foreground"
                }`}
                role="status"
                aria-live="polite"
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    toast?.kind === "down" ? "bg-danger" : "bg-success"
                  }`}
                />
                {toast?.text ?? " "}
              </div>
            </div>
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
    a: "UptimeCrow is an open-source status page platform with built-in uptime monitoring. It watches your APIs and websites, opens incidents automatically, updates your public status page, and alerts subscribers the moment downtime is detected. No manual work needed.",
  },
  {
    q: "How do status pages stay online when my origin is down?",
    a: "UptimeCrow pre-renders your status page as static HTML on every incident update. The pre-rendered page is served completely decoupled from your origin. Even if your app, API, and database are all down, subscribers can still view your status page and incident updates.",
  },
  {
    q: "Is UptimeCrow really free? What's in the free plan?",
    a: "Yes — free forever, no credit card required. The free plan includes 1 status page, 10 monitors, 5-minute check intervals, email alerts, and 7-day history. Upgrade to Indie ($10/mo) for 1-minute checks, custom domains, 1-year history, and Slack/Discord.",
  },
  {
    q: "How does UptimeCrow prevent false alarms?",
    a: "UptimeCrow uses a consecutive-failure state machine. By default, a monitor must fail 2 consecutive checks before an incident is created — a single network blip never pages your team. The confirmation count is configurable per monitor.",
  },
  {
    q: "Can I use my own domain for my status page?",
    a: "Yes. On paid plans you can serve your status page from a custom domain like status.yourapp.com, with your own logo and brand color. Free status pages live at a clean uptimecrow.com URL.",
  },
  {
    q: "How do subscribers get notified?",
    a: "Visitors subscribe to your status page by email with double opt-in verification. On incident updates, UptimeCrow emails subscribers automatically — and pushes updates to your team via Slack, Discord, or custom webhooks.",
  },
  {
    q: "Can I self-host UptimeCrow?",
    a: "Yes. UptimeCrow's full stack is AGPL-3.0 licensed and runs with a single docker compose up command. You bring PostgreSQL and Redis; we provide the code. No vendor lock-in, no data leaving your infrastructure.",
  },
  {
    q: "How often does UptimeCrow check my websites and APIs?",
    a: "Every 5 minutes on Free, every 60 seconds on Indie, every 30 seconds on Pro. A configurable consecutive-failure confirmation means a single blip won't trigger a false incident.",
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
    <section className="mx-auto max-w-3xl px-6 py-20 sm:px-8" id="faq">
      <SectionHead eyebrow="FAQ" title="Common questions." />
      <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border-b border-border last:border-b-0">
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => toggle(i)}
              aria-expanded={open === i}
            >
              <span className="text-[15px] font-semibold">{item.q}</span>
              <span className="font-mono text-lg text-muted-foreground" aria-hidden="true">
                {open === i ? "−" : "+"}
              </span>
            </button>
            {open === i && (
              <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const COMPARISON = [
  { feature: "Auto incident creation", us: "✓ Automatic", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
  { feature: "Auto status page update", us: "✓ Automatic", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
  { feature: "Survives origin downtime", us: "✓ Pre-rendered", bs: "✓", ins: "✓", sp: "✓" },
  { feature: "Uptime monitoring", us: "✓ 5min free, 30s Pro", bs: "✓ 3-min free", ins: "✓ 2-min free", sp: "Add-on" },
  { feature: "Free monitors", us: "✓ 10 free forever", bs: "✓ 10 free", ins: "✓ 15 free", sp: "✗ None" },
  { feature: "Subscriber notifications", us: "✓ Email + Slack", bs: "✓", ins: "✓", sp: "✓" },
  { feature: "Open source / self-host", us: "✓ AGPL-3.0", bs: "✗", ins: "✗", sp: "✗" },
  { feature: "Incident templates", us: "✓ 9 templates", bs: "✗", ins: "✗", sp: "✓" },
  { feature: "False positive prevention", us: "✓ Multi-check", bs: "✓", ins: "✗", sp: "✗" },
  { feature: "Starting price", us: "$10/mo (Indie)", bs: "$24/mo", ins: "$20/mo", sp: "$79/mo" },
];

function cmpCell(v: string) {
  if (v.startsWith("✓"))
    return (
      <span className="inline-flex items-center gap-1.5">
        <Check size={14} className="shrink-0 text-brand" />
        <span>{v.slice(1).trim()}</span>
      </span>
    );
  if (v.startsWith("✗"))
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <X size={14} className="shrink-0" />
        <span>{v.slice(1).trim()}</span>
      </span>
    );
  return <span className="text-muted-foreground">{v}</span>;
}

const PLANS = [
  { name: "Free", price: "$0", desc: "For side projects and personal apps.", features: ["1 status page", "10 monitors", "5-minute check intervals", "Email alerts", "Uptime badge", "7-day history"] },
  { name: "Indie", price: "$10", desc: "For indie hackers and solo founders.", features: ["5 status pages + custom domain", "50 monitors", "1-minute check intervals", "Slack, Discord, webhook alerts", "Email subscribers", "1-year history"] },
  { name: "Pro", price: "$30", desc: "For growing SaaS teams.", popular: true, features: ["10 status pages + custom domain", "100 monitors", "30-second check intervals", "1-year history", "Priority support"] },
  { name: "Team", price: "$80", desc: "For teams that ship fast.", features: ["Everything in Pro", "Unlimited status pages", "200 monitors", "1-year history"] },
];

// ─── Shared bits ───────────────────────────────────────────────────────────────
function SectionHead({
  eyebrow,
  title,
  lead,
  center = true,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h2 className="mt-3 font-display text-[30px] font-bold tracking-[-0.03em] sm:text-[36px]">
        {title}
      </h2>
      {lead && <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

// ─── Landing page ──────────────────────────────────────────────────────────────
export function LandingPage() {
  usePageMeta({
    title: "UptimeCrow — Open-Source Status Pages with Built-In Uptime Monitoring",
    description:
      "Open-source status pages that stay up when you're down. Built-in uptime monitoring, automatic incidents, email subscribers, and custom domains. Self-host under AGPL-3.0 or use the hosted free tier.",
    canonical: "https://uptimecrow.com/",
    jsonLd: LANDING_FAQ_LD,
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <ReactiveHero />

      {/* TRUST STRIP */}
      <div className="border-y border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 font-mono text-[12px] text-muted-foreground sm:px-8">
          <span className="flex items-center gap-1.5">
            <span className="text-brand">★</span> Open source on GitHub
          </span>
          <span className="hidden text-border sm:inline">/</span>
          <span>
            <span className="text-foreground">AGPL-3.0</span> — self-host free
          </span>
          <span className="hidden text-border sm:inline">/</span>
          <span>
            one <span className="text-foreground">docker compose up</span>
          </span>
          <span className="hidden text-border sm:inline">/</span>
          <span>
            up in <span className="text-foreground">3 minutes</span>
          </span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8" id="how">
        <SectionHead
          eyebrow="How it works"
          title="Set it once. The crow does the rest."
          lead="No dashboards to babysit. Add your endpoints, publish your page, go back to building."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              h: "Add your endpoints",
              p: "HTTP, TCP or keyword checks — at the interval you choose, as often as every 30 seconds.",
            },
            {
              n: "2",
              h: "Publish your status page",
              p: "Branded, on your own domain, pre-rendered. A blip is confirmed, not panicked over — a real outage opens an incident and updates the page instantly.",
            },
            {
              n: "3",
              h: "Everyone stays informed",
              p: "Subscribers get emailed on every incident update. Your team gets pinged on Slack, Discord or webhooks.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-xl border border-border bg-card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border font-mono text-sm text-brand">
                {step.n}
              </div>
              <h3 className="mt-5 font-display text-lg font-bold tracking-[-0.02em]">{step.h}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{step.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8" id="features">
        <SectionHead
          eyebrow="Everything you need"
          title="Status pages, monitoring, alerts — one tool."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Featured differentiator */}
          <div className="rounded-xl border border-border bg-card p-6 md:col-span-2 lg:row-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-brand">
              <Globe size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold tracking-[-0.02em]">
              Status pages that survive outages
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
              Every page is pre-rendered to static HTML on each incident update — it serves cached
              bytes, never your database. Down is exactly when it works.
            </p>
            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex items-center gap-1.5 border-b border-border bg-secondary px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-danger/60" />
                <span className="h-2 w-2 rounded-full bg-warning/60" />
                <span className="h-2 w-2 rounded-full bg-success/60" />
              </div>
              <div className="px-4 py-3 font-mono text-[12px] leading-relaxed">
                <div className="text-muted-foreground">
                  <span className="text-brand">$</span> curl -I status.yourapp.com
                </div>
                <div className="mt-1 text-success-foreground">
                  HTTP/2 200 · pre-rendered · 12ms — even mid-outage
                </div>
              </div>
            </div>
          </div>

          {[
            {
              icon: Radio,
              h: "Built-in uptime monitoring",
              p: "HTTP, TCP & keyword checks as often as every 30 seconds, with confirmation that kills false alarms.",
            },
            {
              icon: Users,
              h: "Email subscribers",
              p: "Double opt-in subscriber lists per status page. Every incident update lands in their inbox automatically.",
            },
            {
              icon: ShieldCheck,
              h: "Auto incident detection",
              p: "A real outage opens an incident and updates your status page — no human in the loop.",
            },
          ].map((f) => (
            <FeatureCard key={f.h} {...f} />
          ))}

          {/* Wide: alerts everywhere */}
          <div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-brand">
              <Mail size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display text-lg font-bold tracking-[-0.02em]">
              Alerts everywhere
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
              Incident start &amp; resolve pushed to every channel your team already lives in.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Email", "Slack", "Discord", "Webhooks"].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {[
            {
              icon: Palette,
              h: "Your brand, your domain",
              p: "Custom logo, brand color and a custom domain like status.yourapp.com. Maintenance windows included.",
            },
            {
              icon: Bell,
              h: "Incident templates",
              p: "Nine pre-written templates — one click fills the title and update body. Comms in seconds.",
            },
            {
              icon: Timer,
              h: "Uptime badge",
              p: "Drop a live uptime badge in your README or docs — social proof that updates itself.",
            },
          ].map((f) => (
            <FeatureCard key={f.h} {...f} />
          ))}
        </div>
      </section>

      {/* STATUS PAGE SHOWCASE — ink band */}
      <section className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
        <div className="overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/50">
                Your public face
              </p>
              <h2 className="mt-3 font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
                A status page your users actually trust.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-background/60">
                Custom domain, branded, with subscribers — and it survives the one moment that
                matters: when you&apos;re down.
              </p>
              <div className="mt-7">
                <Button asChild size="lg" variant="brand">
                  <Link to="/register">Create your status page</Link>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-background/15 bg-background/[0.06] backdrop-blur">
              <div className="flex items-center gap-2 border-b border-background/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-background/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-background/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-background/25" />
                <span className="ml-2 font-mono text-[11px] text-background/50">
                  status.yourapp.com
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between rounded-xl border border-background/10 bg-background/[0.04] px-4 py-3">
                  <span className="flex items-center gap-2.5 text-sm font-semibold">
                    <span className="inline-block h-2 w-2 rounded-full bg-brand" />
                    All systems operational
                  </span>
                  <span className="font-mono text-sm tnum text-background/60">99.98%</span>
                </div>
                <div className="mt-3 space-y-px overflow-hidden rounded-xl border border-background/10">
                  {[
                    ["app.yourapp.com", "99.99%", "142ms"],
                    ["api.yourapp.com", "100%", "88ms"],
                    ["auth.yourapp.com", "99.94%", "203ms"],
                    ["payments", "99.99%", "176ms"],
                  ].map(([name, up, ms]) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 border-b border-background/10 px-4 py-2.5 last:border-b-0"
                    >
                      <Check size={13} className="shrink-0 text-brand" />
                      <span className="font-mono text-[12.5px] text-background/85">{name}</span>
                      <span className="ml-auto font-mono text-[11px] tnum text-brand">{up}</span>
                      <span className="font-mono text-[11px] tnum text-background/40">{ms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <SectionHead
          eyebrow="Why switch"
          title="Simple, affordable, and complete."
          lead="Most status-page tools charge enterprise prices for features you actually need. UptimeCrow gives you monitoring, status pages and notifications — without the bloat."
        />
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"></th>
                <th className="px-4 py-3 text-left font-display text-[15px] font-bold text-brand">
                  {BRAND}
                </th>
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  BetterStack
                </th>
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Instatus
                </th>
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Statuspage.io
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-border">
                  <td className="py-3.5 pr-4 font-medium">{row.feature}</td>
                  <td className="bg-brand/[0.06] px-4 py-3.5 text-[13.5px]">{cmpCell(row.us)}</td>
                  <td className="px-4 py-3.5 text-[13.5px]">{cmpCell(row.bs)}</td>
                  <td className="px-4 py-3.5 text-[13.5px]">{cmpCell(row.ins)}</td>
                  <td className="px-4 py-3.5 text-[13.5px]">{cmpCell(row.sp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FAQSection />

      {/* PRICING PREVIEW */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8" id="pricing">
        <SectionHead
          eyebrow="Pricing"
          title="Start free. Self-host for free, forever."
          lead="The hosted tier gets you going in minutes; the open-source core is yours, unlimited."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const pop = plan.popular;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  pop
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-card"
                }`}
              >
                {pop && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-brand px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-foreground">
                    Popular
                  </span>
                )}
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.16em] ${
                    pop ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {plan.name}
                </p>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold tracking-[-0.03em] tnum">
                    {plan.price}
                  </span>
                  <span
                    className={`font-mono text-sm ${
                      pop ? "text-background/50" : "text-muted-foreground"
                    }`}
                  >
                    /mo
                  </span>
                </p>
                <p
                  className={`mt-2 text-[13px] leading-relaxed ${
                    pop ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {plan.desc}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13.5px]">
                      <Check
                        size={14}
                        className={`mt-0.5 shrink-0 ${pop ? "text-brand" : "text-brand"}`}
                      />
                      <span className={pop ? "text-background/85" : "text-foreground/85"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={pop ? "brand" : "outline"}
                  className="mt-6 w-full"
                >
                  <Link to="/register">Get started</Link>
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center font-mono text-[12px] text-muted-foreground">
          Full comparison on the{" "}
          <Link to="/pricing" className="text-brand hover:underline">
            pricing page
          </Link>
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:px-8">
        <img
          src="/crow-mascot.png"
          alt=""
          aria-hidden="true"
          className="mx-auto h-24 w-24 select-none"
        />
        <h2 className="mt-6 font-display text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
          Let the crow take the night shift.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Free for 10 monitors. Self-host unlimited. Up and running in 3 minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/register">Get started free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  h,
  p,
}: {
  icon: typeof Radio;
  h: string;
  p: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-brand">
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-5 font-display text-lg font-bold tracking-[-0.02em]">{h}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{p}</p>
    </div>
  );
}
