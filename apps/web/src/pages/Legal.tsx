import { usePageMeta } from "@/lib/meta";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-6 py-20 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="mt-3 font-display text-[36px] font-extrabold tracking-[-0.035em] sm:text-[42px]">
          {title}
        </h1>
        <p className="mt-3 font-mono text-[12px] text-muted-foreground">
          Last updated: April 13, 2026
        </p>
        <div
          className="mt-10 space-y-4 text-[15px] leading-relaxed text-muted-foreground
            [&_a]:text-brand [&_a]:underline-offset-2 hover:[&_a]:underline
            [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-foreground
            [&_li]:leading-relaxed
            [&_strong]:font-semibold [&_strong]:text-foreground
            [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
        >
          {children}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

export function Privacy() {
  usePageMeta({
    title: "Privacy Policy — UptimeCrow",
    description:
      "How UptimeCrow handles your account data, monitor configurations, and subscriber lists. GDPR and CCPA rights, sub-processors (AWS, Polar), retention windows, and contact for data requests.",
    canonical: "https://uptimecrow.com/privacy",
  });
  return (
    <LegalShell title="Privacy Policy">
      <p>
        UptimeCrow ("we", "us") operates an uptime monitoring and status page service. This policy
        explains what personal data we collect, how we use it, and the rights you have.
      </p>

      <h2>Data We Collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, hashed password, organization name.
        </li>
        <li>
          <strong>Service data:</strong> monitor configurations, check results, incident timelines,
          status page configuration.
        </li>
        <li>
          <strong>Subscriber data:</strong> email addresses collected by our customers for their
          status page subscribers.
        </li>
        <li>
          <strong>Billing data:</strong> processed by our billing provider (Polar). We store only
          the customer ID and plan tier.
        </li>
        <li>
          <strong>Technical data:</strong> IP address and user agent for rate limiting and abuse
          prevention.
        </li>
      </ul>

      <h2>How We Use Data</h2>
      <ul>
        <li>To provide the service you signed up for.</li>
        <li>
          To send transactional email (incident alerts, password resets, subscriber confirmations)
          via Amazon SES.
        </li>
        <li>To enforce plan limits and prevent abuse.</li>
        <li>To communicate important service updates.</li>
      </ul>
      <p>We do not sell personal data. We do not use data for advertising.</p>

      <h2>Sub-processors</h2>
      <ul>
        <li>Amazon Web Services (hosting and email via SES)</li>
        <li>Polar (billing and invoicing)</li>
      </ul>

      <h2>Your Rights (GDPR / CCPA)</h2>
      <p>
        You can request access to, export, or deletion of your personal data at any time. Email
        <a href="mailto:support@uptimecrow.com"> support@uptimecrow.com</a> and we will respond
        within 30 days.
      </p>

      <h2>Data Retention</h2>
      <p>
        Check result history is retained according to your plan (7 days on Free, 1 year on
        Indie/Pro/Team). Account and organization data is retained until you delete your account.
        Subscriber data is retained until the subscriber unsubscribes or your status page is deleted.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:support@uptimecrow.com">support@uptimecrow.com</a>.
      </p>
    </LegalShell>
  );
}

export function Terms() {
  usePageMeta({
    title: "Terms of Service — UptimeCrow",
    description:
      "The terms governing your use of UptimeCrow: acceptable use, billing and refund policy, no-warranty disclaimer, termination, and how we communicate material changes.",
    canonical: "https://uptimecrow.com/terms",
  });
  return (
    <LegalShell title="Terms of Service">
      <p>
        These terms govern your use of UptimeCrow. By creating an account you agree to be bound by
        these terms.
      </p>

      <h2>The Service</h2>
      <p>
        UptimeCrow provides uptime monitoring, incident management, and public status pages on a
        subscription basis. Plan limits (monitors, check interval, retention) are enforced as
        described on our pricing page.
      </p>

      <h2>Acceptable Use</h2>
      <ul>
        <li>You may only monitor endpoints you own or have explicit permission to monitor.</li>
        <li>You must not use the service to launch attacks, perform load testing, or send spam.</li>
        <li>You are responsible for the content published on your status pages.</li>
        <li>We may suspend accounts that violate these terms or abuse the service.</li>
      </ul>

      <h2>Payment and Refunds</h2>
      <p>
        Paid plans are billed monthly or annually through Polar. You can cancel at any time; your
        plan remains active until the end of the current period. Refunds are handled case-by-case —
        email
        <a href="mailto:support@uptimecrow.com"> support@uptimecrow.com</a>.
      </p>
      <h2>No Warranty / SLA</h2>
      <p>
        The service is provided "as is". We do not offer a guaranteed SLA on the Free plan. Paid
        plans may include service credits for extended downtime; see your plan's terms for details.
        In no event will our liability exceed the amount you paid us in the previous 12 months.
      </p>

      <h2>Termination</h2>
      <p>
        You may terminate your account at any time from the Settings page. We may terminate accounts
        that violate these terms with reasonable notice.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Material changes will be announced by email at least 30 days
        before they take effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:support@uptimecrow.com">support@uptimecrow.com</a>.
      </p>
    </LegalShell>
  );
}
