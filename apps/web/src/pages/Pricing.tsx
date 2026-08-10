import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { useAuthStore } from "@/lib/auth";
import { usePageMeta } from "@/lib/meta";
import { PLAN_CATALOG, PLAN_LIMITS, formatPrice } from "@uptimecrow/shared";

// ─── Comparison table ─────────────────────────────────────────────────────────
// Every cell is derived from PLAN_LIMITS so the table can never drift from what
// the API actually enforces. Only plans we sell (PLAN_CATALOG) get a column.

const fmtInterval = (s: number) => (s >= 60 ? `${s / 60} min` : `${s} sec`);
const fmtRetention = (d: number) => (d >= 365 ? `${Math.round(d / 365)} year` : `${d} days`);

const COMPARE_ROWS: { label: string; value: (l: (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS]) => string | boolean }[] = [
  { label: "Status pages", value: (l) => (l.statusPages === Infinity ? "Unlimited" : `${l.statusPages}`) },
  { label: "Monitors", value: (l) => `${l.monitors}` },
  { label: "Check interval", value: (l) => fmtInterval(l.minInterval) },
  { label: "History retention", value: (l) => fmtRetention(l.retentionDays) },
  { label: "Custom domain", value: (l) => l.customDomain },
  { label: "Slack, Discord & webhooks", value: (l) => l.slackWebhook },
  { label: "Team seats", value: (l) => `${l.teamSeats}` },
];

function CompareCell({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return <span className="font-mono text-[13.5px] tnum">{value}</span>;
  }
  return value ? (
    <Check size={15} className="mx-auto text-brand" aria-label="Included" />
  ) : (
    <Minus size={15} className="mx-auto text-muted-foreground/50" aria-label="Not included" />
  );
}

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
    a: "Each HTTP, TCP, or keyword check is one monitor. A monitor can appear on any number of your status pages.",
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
      "Start free with 10 monitors. Upgrade to Indie ($9/mo) for 1-minute checks, 1-year history, and Slack/Discord alerts, or Pro ($30/mo) for 30-second checks and 100 monitors.",
    canonical: "https://uptimecrow.com/pricing",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "UptimeCrow",
      url: "https://uptimecrow.com",
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Status pages and uptime monitoring",
      operatingSystem: "Any (web, Docker)",
      description:
        "Open-source status page platform with built-in uptime monitoring. Monitor HTTP, TCP, and keyword endpoints; auto-create incidents; serve pre-rendered status pages that survive origin downtime.",
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
  useEffect(() => {
    analytics.pricingViewed();
  }, []);

  const ctaHref = isAuthenticated ? "/dashboard/settings" : "/register";

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-14 text-center sm:px-8">
        <h1 className="font-display text-[40px] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">
          Simple pricing. <span className="text-brand">No lock-in.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Free forever to start. Or self-host the whole thing under AGPL-3.0.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={`font-mono text-[13px] ${
              annual ? "text-muted-foreground" : "font-medium text-foreground"
            }`}
          >
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setAnnual((v) => !v)}
            aria-label="Toggle annual billing"
            role="switch"
            aria-checked={annual}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              annual ? "bg-brand" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${
                annual ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
          <span className="flex items-center gap-2">
            <span
              className={`font-mono text-[13px] ${
                annual ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              Annual
            </span>
            {annual && (
              <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-brand">
                2 months free
              </span>
            )}
          </span>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="mx-auto max-w-5xl px-6 pt-4 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_CATALOG.map((plan) => {
            const isAnnualPaid = annual && plan.monthlyPrice > 0;
            const displayPrice = isAnnualPaid
              ? `$${formatPrice(plan.annualMonthlyPrice)}`
              : plan.monthlyPrice === 0
                ? "$0"
                : `$${formatPrice(plan.monthlyPrice)}`;
            const pop = plan.featured;
            return (
              <div
                key={plan.plan}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  pop ? "border-transparent bg-foreground text-background" : "border-border bg-card"
                }`}
              >
                {pop && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-foreground">
                    Most popular
                  </span>
                )}
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.16em] ${
                    pop ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {plan.name}
                </p>
                <p className="mt-3 flex items-baseline gap-1.5">
                  {isAnnualPaid && (
                    <span
                      className={`font-display text-2xl font-bold tracking-[-0.03em] line-through tnum ${
                        pop ? "text-background/35" : "text-muted-foreground/60"
                      }`}
                    >
                      ${formatPrice(plan.monthlyPrice)}
                    </span>
                  )}
                  <span className="font-display text-4xl font-extrabold tracking-[-0.03em] tnum">
                    {displayPrice}
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
                  className={`mt-1 font-mono text-[12px] ${
                    pop ? "text-background/50" : "text-muted-foreground"
                  }`}
                >
                  {isAnnualPaid
                    ? `billed $${plan.annualTotal}/yr · 2 months free`
                    : plan.monthlyPrice === 0
                      ? "free forever"
                      : "billed monthly"}
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
                      <Check size={14} className="mt-0.5 shrink-0 text-brand" />
                      <span className={pop ? "text-background/85" : "text-foreground/85"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={pop ? "brand" : "outline"}
                  className="mt-6 w-full"
                  onClick={() => analytics.upgradeClicked(plan.name)}
                >
                  <Link to={plan.plan === "free" ? "/register" : ctaHref}>
                    {plan.plan === "free"
                      ? "Get started free"
                      : isAuthenticated
                        ? "Upgrade now"
                        : "Get started"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* COMPARISON — the numbers, side by side. This is the question the
            cards can't answer ("how many monitors do I actually get?"). */}
        <div className="mt-14 scroll-mt-20" id="compare">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.03em]">
            Compare the limits.
          </h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">Plan limits compared</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-3 pr-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Limit
                  </th>
                  {PLAN_CATALOG.map((p) => (
                    <th
                      key={p.plan}
                      scope="col"
                      className={`w-[18%] py-3 text-center font-display text-[15px] font-bold tracking-[-0.02em] ${
                        p.featured ? "bg-brand/[0.06] text-brand" : ""
                      }`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border">
                    <th scope="row" className="py-3 pr-4 text-[14px] font-medium">
                      {row.label}
                    </th>
                    {PLAN_CATALOG.map((p) => (
                      <td
                        key={p.plan}
                        className={`py-3 text-center ${p.featured ? "bg-brand/[0.06]" : ""}`}
                      >
                        <CompareCell value={row.value(PLAN_LIMITS[p.plan])} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-mono text-[11.5px] text-muted-foreground">
            self-hosting under AGPL-3.0 has no plan limits at all —{" "}
            <Link to="/self-host" className="text-foreground underline underline-offset-2">
              see the guide
            </Link>
          </p>
        </div>

        {/* Enterprise hook */}
        <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="font-display text-lg font-bold tracking-[-0.02em]">Need more than Pro?</p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              More monitors, custom data retention, SSO, DPA, or a custom invoice — tell us what you
              need.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <a href="mailto:support@uptimecrow.com?subject=Custom plan inquiry">Contact us →</a>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
            Frequently asked
          </p>
          <h2 className="mt-3 font-display text-[30px] font-bold tracking-[-0.03em] sm:text-[34px]">
            Before you commit.
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold">
                {item.q}
                <span className="font-mono text-lg text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center sm:px-8">
        <div className="rounded-3xl bg-foreground px-8 py-14 text-background sm:px-12">
          <h2 className="font-display text-[30px] font-extrabold tracking-[-0.03em] sm:text-[36px]">
            Ready to know when you&apos;re down?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-background/60">
            10 monitors, 5-min checks, forever free — or self-host unlimited. No credit card needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="brand">
              <Link to="/register">Get started free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
