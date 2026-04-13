import { Link } from "react-router-dom";
import { Logo } from "@/components/logo";

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Logo size="md" to="/" />
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: April 13, 2026</p>
        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
      </main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} UptimeCrow. All rights reserved.
      </footer>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        UptimeCrow ("we", "us") operates an uptime monitoring and status page service. This policy explains
        what personal data we collect, how we use it, and the rights you have.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Data We Collect</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Account data:</strong> email address, hashed password, organization name.</li>
        <li><strong>Service data:</strong> monitor configurations, check results, incident timelines, status page configuration.</li>
        <li><strong>Subscriber data:</strong> email addresses collected by our customers for their status page subscribers.</li>
        <li><strong>Billing data:</strong> processed by our billing provider (Polar). We store only the customer ID and plan tier.</li>
        <li><strong>Technical data:</strong> IP address and user agent for rate limiting and abuse prevention.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">How We Use Data</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>To provide the service you signed up for.</li>
        <li>To send transactional email (incident alerts, password resets, subscriber confirmations) via Amazon SES.</li>
        <li>To enforce plan limits and prevent abuse.</li>
        <li>To communicate important service updates.</li>
      </ul>
      <p>We do not sell personal data. We do not use data for advertising.</p>

      <h2 className="mt-8 text-xl font-semibold">Sub-processors</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Amazon Web Services (hosting and email via SES)</li>
        <li>Polar (billing and invoicing)</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Your Rights (GDPR / CCPA)</h2>
      <p>
        You can request access to, export, or deletion of your personal data at any time. Email
        <a href="mailto:privacy@uptimecrow.com" className="text-primary"> privacy@uptimecrow.com</a> and we will
        respond within 30 days.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Data Retention</h2>
      <p>
        Check result history is retained according to your plan (7 days Free, 90 days Pro, 365 days Team). Account and
        organization data is retained until you delete your account. Subscriber data is retained until the subscriber
        unsubscribes or your status page is deleted.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p>
        Questions? Email <a href="mailto:privacy@uptimecrow.com" className="text-primary">privacy@uptimecrow.com</a>.
      </p>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        These terms govern your use of UptimeCrow. By creating an account you agree to be bound by these terms.
      </p>

      <h2 className="mt-8 text-xl font-semibold">The Service</h2>
      <p>
        UptimeCrow provides uptime monitoring, incident management, and public status pages on a subscription basis.
        Plan limits (monitors, check interval, regions, retention) are enforced as described on our pricing page.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Acceptable Use</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>You may only monitor endpoints you own or have explicit permission to monitor.</li>
        <li>You must not use the service to launch attacks, perform load testing, or send spam.</li>
        <li>You are responsible for the content published on your status pages.</li>
        <li>We may suspend accounts that violate these terms or abuse the service.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Payment and Refunds</h2>
      <p>
        Paid plans are billed monthly or annually through Polar. You can cancel at any time; your plan
        remains active until the end of the current period. Refunds are handled case-by-case — email
        <a href="mailto:billing@uptimecrow.com" className="text-primary"> billing@uptimecrow.com</a>.
      </p>

      <h2 className="mt-8 text-xl font-semibold">No Warranty / SLA</h2>
      <p>
        The service is provided "as is". We do not offer a guaranteed SLA on the Free plan. Paid plans may include
        service credits for extended downtime; see your plan's terms for details. In no event will our liability exceed
        the amount you paid us in the previous 12 months.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Termination</h2>
      <p>
        You may terminate your account at any time from the Settings page. We may terminate accounts that violate these
        terms with reasonable notice.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Changes</h2>
      <p>
        We may update these terms. Material changes will be announced by email at least 30 days before they take effect.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p>
        Questions? Email <a href="mailto:legal@uptimecrow.com" className="text-primary">legal@uptimecrow.com</a>.
      </p>
    </LegalShell>
  );
}
