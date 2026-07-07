import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { useAuthStore } from "@/lib/auth";
import { usePageMeta } from "@/lib/meta";
import { PLAN_CATALOG } from "@uptimecrow/shared";

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
      "Start free with 10 monitors. Upgrade to Indie ($10/mo) for 1-minute checks, 1-year history, and Slack/Discord alerts, or Pro ($30/mo) for 30-second checks and 100 monitors.",
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
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-20 text-center sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          Fair pricing · no lock-in
        </p>
        <h1 className="mt-4 font-display text-[42px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
          Simple pricing. <span className="text-brand">Pick a plan that fits.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          Start free forever. Upgrade when you need more monitors, faster checks, or a branded
          status page.
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
      <section className="mx-auto max-w-6xl px-6 pt-4 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_CATALOG.map((plan) => {
            const isAnnualPaid = annual && plan.monthlyPrice > 0;
            const displayPrice = isAnnualPaid
              ? `$${plan.annualMonthlyPrice}`
              : plan.monthlyPrice === 0
                ? "$0"
                : `$${plan.monthlyPrice}`;
            const pop = plan.featured;
            return (
              <div
                key={plan.plan}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  pop ? "border-transparent bg-foreground text-background" : "border-border bg-card"
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
                {isAnnualPaid && (
                  <p
                    className={`mt-1 font-mono text-[12px] ${
                      pop ? "text-background/50" : "text-muted-foreground"
                    }`}
                  >
                    billed ${plan.annualTotal}/yr
                  </p>
                )}
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

        {/* Enterprise hook */}
        <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:px-8">
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
