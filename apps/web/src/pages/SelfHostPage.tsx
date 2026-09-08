import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/meta";

const BRAND = "UptimeCrow";

const COMPOSE_SNIPPET = `services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: uptimecrow
      POSTGRES_USER: uptimecrow
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redisdata:/data

  api:
    image: ghcr.io/ozers/uptimecrow/api:latest
    restart: unless-stopped
    depends_on: [postgres, redis]
    environment:
      MODE: all
      NODE_ENV: production
      DATABASE_URL: postgres://uptimecrow:\${POSTGRES_PASSWORD}@postgres:5432/uptimecrow
      REDIS_URL: redis://redis:6379
      JWT_SECRET: \${JWT_SECRET}
      APP_URL: \${APP_URL}
      # Optional — email alerts via Amazon SES
      AWS_ACCESS_KEY_ID: \${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: \${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: us-east-1
      SES_FROM_EMAIL: alerts@yourdomain.com
    ports:
      # The API image serves the web UI too — this is the whole product.
      - "80:3000"

volumes:
  pgdata:
  redisdata:`;

const ENV_SNIPPET = `# .env — generate strong secrets with openssl
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
APP_URL=https://uptime.yourdomain.com

# Optional: Amazon SES for email alerts. Slack/Discord/webhook alerts
# work without these — leave blank to disable email.
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=`;

const START_SNIPPET = `# Pull images and start all 3 containers.
# Migrations run automatically on API startup — no extra step needed.
docker compose up -d

# Watch logs while it warms up
docker compose logs -f api

# Verify everything is healthy
docker compose ps`;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-card px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-muted-foreground">
      <code>{code}</code>
    </pre>
  );
}

const COMPARISON: { feature: string; self: [boolean, string]; cloud: [boolean, string] }[] = [
  { feature: "Data ownership", self: [true, "100% yours"], cloud: [false, "Hosted on our infra"] },
  { feature: "Cost at scale", self: [true, "VPS cost only"], cloud: [false, "Per-plan pricing"] },
  { feature: "Setup time", self: [false, "~5 minutes"], cloud: [true, "30 seconds"] },
  { feature: "Maintenance", self: [false, "You manage updates"], cloud: [true, "Automatic"] },
  { feature: "Uptime SLA", self: [false, "Depends on your VPS"], cloud: [true, "99.9%"] },
  { feature: "Custom extensions", self: [true, "Full source access"], cloud: [false, "Fixed feature set"] },
  { feature: "License", self: [true, "AGPL-3.0 — full source"], cloud: [false, "SaaS ToS"] },
];

export default function SelfHostPage() {
  usePageMeta({
    title: "Self-Host UptimeCrow — Open-Source Uptime Monitoring with Docker",
    description:
      "Run UptimeCrow on your own infrastructure with a single Docker Compose command. AGPL-3.0 licensed, open-source uptime monitoring and status pages. No vendor lock-in.",
    canonical: "https://uptimecrow.com/self-host",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Self-host UptimeCrow with Docker Compose",
      description:
        "Run the full UptimeCrow stack (Postgres, Redis, and the app container that serves the API, the worker and the web UI) on your own VPS with one command.",
      totalTime: "PT5M",
      supply: [
        { "@type": "HowToSupply", name: "A VPS or machine running Docker 24+" },
        { "@type": "HowToSupply", name: "512 MB RAM minimum" },
      ],
      tool: [
        { "@type": "HowToTool", name: "Docker Engine 24+" },
        { "@type": "HowToTool", name: "Docker Compose v2" },
      ],
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Download the compose file and env template",
          text: "Fetch docker-compose.prod.yml and .env.prod.example from the GitHub repository.",
          url: "https://github.com/ozers/uptimecrow#production-self-host",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Generate strong secrets",
          text: "Run `openssl rand -hex 32` for JWT_SECRET and `openssl rand -hex 24` for POSTGRES_PASSWORD. Set APP_URL to your public URL.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Start the stack",
          text: "Run `docker compose -f docker-compose.prod.yml up -d`. Database migrations run automatically on API startup.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Verify",
          text: "Check `docker compose ps` — four healthy containers. Open APP_URL in a browser, register a user, create a monitor.",
        },
      ],
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-20 text-center sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          AGPL-3.0 licensed · own your monitoring stack
        </p>
        <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[50px]">
          Run your own uptime monitor{" "}
          <span className="text-brand">in 5 minutes.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          3 Docker containers. 512 MB RAM. Any VPS. Full source code included — fork it, extend it,
          or just run it as-is.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/register">Use the cloud version free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com/ozers/uptimecrow" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">Requirements</p>
        <h2 className="mt-2 font-display text-[28px] font-bold tracking-[-0.03em]">
          Nothing exotic.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              h: "Docker + Compose",
              p: "Any machine running Docker Engine 24+ and Docker Compose v2. That's the only hard requirement.",
            },
            {
              h: "512 MB RAM",
              p: "A $4/mo VPS handles dozens of monitors comfortably. Scale up when you need more check frequency or history retention.",
            },
            {
              h: "Optional: SES",
              p: "Email alerts need Amazon SES. Slack and Discord webhooks work without any email config — you can add SES later.",
            },
          ].map((r) => (
            <div key={r.h} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-[15px] font-bold">{r.h}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{r.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONFIGURATION */}
      <section className="mx-auto max-w-3xl px-6 py-4 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">Configuration</p>
        <h2 className="mt-2 font-display text-[28px] font-bold tracking-[-0.03em]">
          The full stack in one file.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Postgres 16, Redis 7, and one {BRAND} container running the API, the worker and the web UI.
          Copy this into{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
            docker-compose.yml
          </code>{" "}
          and create a{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
            .env
          </code>{" "}
          alongside it.
        </p>
        <div className="mt-5">
          <CodeBlock code={COMPOSE_SNIPPET} />
        </div>

        <p className="mb-2 mt-8 font-display text-[15px] font-bold">
          Environment variables{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] font-normal text-foreground">
            .env
          </code>
        </p>
        <CodeBlock code={ENV_SNIPPET} />

        <p className="mb-2 mt-8 font-display text-[15px] font-bold">Start everything</p>
        <CodeBlock code={START_SNIPPET} />

        <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
          After <code className="font-mono text-foreground">docker compose up</code>: everything is on{" "}
          <strong className="text-foreground">:80</strong> — the UI and the API share one origin, so
          there is no CORS to configure and no proxy to keep in sync. Put Caddy or nginx in front for
          TLS. (In the development compose file the Vite dev server still runs separately on{" "}
          <strong className="text-foreground">:5173</strong>.)
        </p>
      </section>

      {/* SELF-HOST VS CLOUD */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          Self-host vs cloud
        </p>
        <h2 className="mt-2 font-display text-[28px] font-bold tracking-[-0.03em]">
          Pick what fits your situation.
        </h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left"></th>
                <th className="px-4 py-3 text-left font-display text-[15px] font-bold text-brand">
                  Self-hosted
                </th>
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {BRAND} Cloud
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-border">
                  <td className="py-3.5 pr-4 font-medium">{row.feature}</td>
                  <td className="bg-brand/[0.06] px-4 py-3.5 text-[13.5px]">
                    <span className="inline-flex items-center gap-1.5">
                      {row.self[0] && <Check size={14} className="shrink-0 text-brand" />}
                      <span className={row.self[0] ? "" : "text-muted-foreground"}>
                        {row.self[1]}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[13.5px]">
                    <span className="inline-flex items-center gap-1.5">
                      {row.cloud[0] && <Check size={14} className="shrink-0 text-brand" />}
                      <span className={row.cloud[0] ? "" : "text-muted-foreground"}>
                        {row.cloud[1]}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* WHY SELF-HOST */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">Common reasons</p>
        <h2 className="mt-2 font-display text-[28px] font-bold tracking-[-0.03em]">
          When self-hosting is the right call.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              h: "Compliance requirements",
              p: "SOC 2, HIPAA, or internal policies that forbid sending infrastructure data to third-party SaaS tools.",
            },
            {
              h: "Air-gapped environments",
              p: "Monitor internal services that are never exposed to the public internet. Your checker runs inside your network.",
            },
            {
              h: "Cost predictability",
              p: "Monitoring 500 endpoints? A $20/mo VPS beats any per-monitor pricing tier at that scale.",
            },
            {
              h: "Full customisation",
              p: "Add custom check types, notification channels, or integrate with internal tooling. It's your codebase now.",
            },
          ].map((r) => (
            <div key={r.h} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-[15px] font-bold">{r.h}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{r.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center sm:px-8">
        <div className="rounded-3xl bg-foreground px-8 py-14 text-background sm:px-12">
          <h2 className="font-display text-[28px] font-extrabold tracking-[-0.03em] sm:text-[34px]">
            Start on the cloud. Move to self-host whenever.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-background/60">
            The cloud version is free for up to 10 monitors — or self-host unlimited. Export your
            data and self-host whenever you&apos;re ready.
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
              <Link to="/docs">Self-host docs</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
