import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/meta";
import { ShieldCheck, Radio, Terminal, ArrowRight } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/ozers/uptimecrow";

// ─── FAQ (kept for SEO — FAQPage JSON-LD) ─────────────────────────────────────

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
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        FAQ
      </p>
      <h2 className="mt-3 font-display text-[28px] font-bold tracking-[-0.03em]">
        Common questions.
      </h2>
      <div className="mt-8 divide-y divide-border border-t border-border">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            <button
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              onClick={() => toggle(i)}
              aria-expanded={open === i}
            >
              <span className="text-[15px] font-semibold">{item.q}</span>
              <span className="font-mono text-lg text-muted-foreground" aria-hidden="true">
                {open === i ? "−" : "+"}
              </span>
            </button>
            {open === i && (
              <p className="pb-5 text-[14.5px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
// One message, one visual. The hero shows the REAL status page the product
// renders (a screenshot of renderStatusHtml output) — the promise, not a mock.

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

      {/* ── HERO — one message ── */}
      <section className="mx-auto max-w-4xl px-6 pt-20 text-center sm:px-8 sm:pt-28">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Open source · AGPL-3.0
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-[42px] font-extrabold leading-[1.02] tracking-[-0.04em] text-balance sm:text-[64px]">
          Status pages that stay up{" "}
          <span className="text-brand">when you&apos;re down.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          UptimeCrow watches your services, opens incidents automatically, and
          serves a pre-rendered status page that keeps answering — even when
          everything else doesn&apos;t.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/register">
              Create your status page — free
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              ★ Star on GitHub
            </a>
          </Button>
        </div>
        <p className="mt-5 font-mono text-[12px] text-muted-foreground">
          free tier · no credit card · or self-host with{" "}
          <span className="text-foreground">docker compose up</span>
        </p>
      </section>

      {/* ── THE PROMISE, SHOWN — real product output, not a mockup ── */}
      <section className="mx-auto max-w-5xl px-6 pb-6 pt-14 sm:px-8">
        <figure>
          <div className="overflow-hidden rounded-xl border border-border shadow-[0_1px_2px_rgba(42,34,48,.06),0_32px_64px_-32px_rgba(42,34,48,.35)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
              <span className="ml-3 rounded-md bg-background/60 px-3 py-0.5 font-mono text-[11px] text-muted-foreground">
                status.yourapp.com
              </span>
            </div>
            <img
              src="/product-status-preview.png"
              alt="A live UptimeCrow status page: all systems operational, 99.99% uptime over 90 days, three monitored services with daily uptime bars, and incident history."
              width={1120}
              height={840}
              className="block w-full"
              loading="eager"
            />
          </div>
          <figcaption className="mt-3 text-center font-mono text-[11px] text-muted-foreground">
            the actual page UptimeCrow serves — pre-rendered static HTML, so it
            survives your outage
          </figcaption>
        </figure>
      </section>

      {/* ── HOW — three steps, one line each ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8" id="how">
        <div className="grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { n: "01", t: "Add your endpoints", d: "HTTP, TCP or keyword checks — HEAD mode for near-zero load." },
            { n: "02", t: "Pick a slug", d: "Your page is live at status.yourapp.com or a free URL." },
            { n: "03", t: "Share it", d: "Down? Incident opens, subscribers get emailed — automatically." },
          ].map((s) => (
            <div key={s.n} className="px-6 py-6">
              <p className="font-mono text-[11px] font-semibold text-brand">{s.n}</p>
              <p className="mt-2 font-display text-[17px] font-bold tracking-[-0.02em]">{s.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY — three proofs, ruled ── */}
      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8" id="features">
        <div className="grid grid-cols-1 gap-x-14 gap-y-10 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              t: "Survives your outage",
              d: "The page is pre-rendered static HTML, decoupled from your stack. App, API and database can all be down — your status page still answers.",
            },
            {
              icon: Radio,
              t: "Monitoring built in",
              d: "No separate uptime tool to wire up. Checks every 30s–5min, consecutive-failure confirmation kills false alarms, incidents open and resolve themselves.",
            },
            {
              icon: Terminal,
              t: "Yours, either way",
              d: "AGPL-3.0, one docker compose up to self-host — or use the hosted free tier. Custom domain, your logo, your brand color.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t}>
              <div className="flex items-center gap-2 border-t-2 border-brand/60 pt-4">
                <Icon className="h-4 w-4 text-brand" />
                <p className="font-display text-[16px] font-bold tracking-[-0.02em]">{t}</p>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INK CTA ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-8">
        <div className="rounded-xl bg-foreground px-8 py-12 text-center text-background sm:px-14">
          <h2 className="font-display text-[30px] font-extrabold tracking-[-0.035em] sm:text-[38px]">
            Put a crow on your uptime.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-background/60">
            Ten monitors and a status page, free forever. Live in three minutes.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="brand" asChild>
              <Link to="/register">Get started free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to="/self-host">Self-host instead</Link>
            </Button>
          </div>
        </div>
      </section>

      <FAQSection />
      <MarketingFooter />
    </div>
  );
}
