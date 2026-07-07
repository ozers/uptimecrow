import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { usePageMeta } from "@/lib/meta";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative mb-4">
      <pre className="overflow-x-auto rounded-xl border border-border bg-card px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-foreground/80">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Copy code"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const ENDPOINT_GROUPS = [
  {
    tag: "Monitors",
    endpoints: [
      "GET /api/monitors",
      "POST /api/monitors",
      "GET /api/monitors/:id",
      "PATCH /api/monitors/:id",
      "DELETE /api/monitors/:id",
      "GET /api/monitors/:id/checks",
    ],
  },
  {
    tag: "Incidents",
    endpoints: [
      "GET /api/incidents",
      "POST /api/incidents",
      "GET /api/incidents/:id",
      "PATCH /api/incidents/:id",
      "POST /api/incidents/:id/updates",
    ],
  },
  {
    tag: "Status Pages",
    endpoints: [
      "GET /api/status-pages",
      "GET /api/status-pages/:id",
      "PUT /api/status-pages/:id/monitors",
    ],
  },
  {
    tag: "Maintenance",
    endpoints: [
      "GET /api/maintenance-windows",
      "POST /api/maintenance-windows",
      "PATCH /api/maintenance-windows/:id",
      "DELETE /api/maintenance-windows/:id",
    ],
  },
  {
    tag: "Public",
    endpoints: [
      "GET /status/:slug",
      "GET /status/:slug/incidents",
      "POST /status/:slug/subscribe",
      "GET /badge/:slug.svg",
    ],
  },
];

function DocSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h2 className="mt-2 font-display text-[24px] font-bold tracking-[-0.02em]">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function Docs() {
  useEffect(() => {
    analytics.docsViewed();
  }, []);

  usePageMeta({
    title: "API Documentation — UptimeCrow Developer Docs",
    description:
      "UptimeCrow REST API reference for monitors, incidents, status pages, and maintenance windows. Full OpenAPI spec available.",
    canonical: "https://uptimecrow.com/docs",
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-20 text-center sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">Developer API</p>
        <h1 className="mt-4 font-display text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[46px]">
          REST API for uptime monitoring
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          Automate monitor creation, trigger incidents, manage status pages — all from your CI/CD
          pipeline or scripts.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              Open API Reference <ExternalLink size={14} />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/register">Create free account</Link>
          </Button>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-3xl px-6 py-14 sm:px-8">
        <DocSection eyebrow="Authentication" title="Session tokens">
          <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
            Log in with{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
              POST /api/auth/login
            </code>{" "}
            to receive a JWT. Pass it as a Bearer token in every request (the dashboard uses the same
            token as an HTTP-only cookie):
          </p>
          <CodeBlock
            code={`# Get a token
curl -X POST https://uptimecrow.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@company.com", "password": "..."}'

# Use it
curl https://uptimecrow.com/api/monitors \\
  -H "Authorization: Bearer <token>"`}
          />
          <div className="rounded-xl border border-border bg-card px-5 py-4 text-[14px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Note:</strong> tokens are valid for 7 days and are
            scoped to your organization — one token can manage all your monitors and status pages.
          </div>
        </DocSection>

        <DocSection eyebrow="Quick Start" title="5 minutes to full monitoring">
          <h3 className="mb-2 font-display text-[15px] font-bold">1. Create a monitor</h3>
          <CodeBlock
            code={`curl -X POST https://uptimecrow.com/api/monitors \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API",
    "url": "https://api.yourapp.com/health",
    "type": "http",
    "intervalSeconds": 60
  }'`}
          />

          <h3 className="mb-2 mt-6 font-display text-[15px] font-bold">
            2. Create an incident manually
          </h3>
          <CodeBlock
            code={`curl -X POST https://uptimecrow.com/api/incidents \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "statusPageId": "your-status-page-id",
    "title": "Investigating elevated error rates",
    "severity": "major",
    "status": "investigating",
    "body": "We are investigating elevated error rates on our API. Updates to follow."
  }'`}
          />

          <h3 className="mb-2 mt-6 font-display text-[15px] font-bold">3. Resolve it</h3>
          <CodeBlock
            code={`curl -X POST https://uptimecrow.com/api/incidents/{id}/updates \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "resolved", "body": "The issue has been resolved. All systems operational."}'`}
          />
        </DocSection>

        <DocSection eyebrow="Endpoints" title="Full API surface">
          <div className="grid gap-4 sm:grid-cols-2">
            {ENDPOINT_GROUPS.map((group) => (
              <div key={group.tag} className="rounded-xl border border-border bg-card p-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
                  {group.tag}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {group.endpoints.map((ep) => (
                    <li key={ep} className="font-mono text-[12px] text-muted-foreground">
                      {ep}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DocSection>

        <div className="py-6 text-center">
          <Button asChild size="lg">
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              Open interactive API reference <ExternalLink size={14} />
            </a>
          </Button>
          <p className="mt-4 font-mono text-[12px] text-muted-foreground">
            Powered by Swagger UI — try every endpoint in the browser.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
