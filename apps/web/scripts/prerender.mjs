// Build-time pre-render of the marketing routes.
//
// The app is a client-rendered SPA, so the raw HTML a non-rendering crawler
// receives is an empty <div id="root">. Google renders JS; most AI crawlers
// (CCBot, Bytespider, Amazonbot, and every plain-HTTP fetcher) do not — they
// saw ~9 words and no <h1>. On top of that, nginx served the SAME index.html
// for every route, so /pricing and /docs shipped the landing page's title,
// description and canonical.
//
// This script fixes both without a headless browser: it takes the built
// dist/index.html as a template and writes one static HTML file per marketing
// route, with route-specific <title>/description/canonical/OG plus a real
// content block (h1, prose, links) inside #root. React's createRoot() clears
// the container on mount, so browsers still get the full SPA — the static copy
// is what bots and the first paint see, and it mirrors the React copy.
//
// nginx `try_files $uri $uri/ /index.html` picks up dist/<route>/index.html
// before falling back to the SPA shell, so no server change is needed.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const ORIGIN = "https://uptimecrow.com";

const SHELL_START = "<!--static-shell-->";
const SHELL_END = "<!--/static-shell-->";
const FAQ_START = "<!--faq-ld-->";
const FAQ_END = "<!--/faq-ld-->";

// ─── Content ──────────────────────────────────────────────────────────────────
// Mirrors the React copy. When landing/pricing/docs copy changes materially,
// change it here too — a static shell that contradicts the rendered page is
// worse than no static shell.

const nav = `
  <nav class="uc-nav" aria-label="Primary">
    <a href="/">UptimeCrow</a>
    <a href="/pricing">Pricing</a>
    <a href="/docs">Docs</a>
    <a href="/self-host">Self-host</a>
    <a href="/changelog">Changelog</a>
    <a href="https://github.com/ozers/uptimecrow" rel="noopener">GitHub</a>
  </nav>`;

const footer = `
  <footer class="uc-footer">
    <p>UptimeCrow — open-source status pages with built-in uptime monitoring.
    AGPL-3.0. <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> ·
    <a href="/llms.txt">llms.txt</a></p>
  </footer>`;

const faq = [
  [
    "What is UptimeCrow?",
    "UptimeCrow is an open-source status page platform with built-in uptime monitoring. It watches your APIs and websites, opens incidents automatically, updates your public status page, and alerts subscribers the moment downtime is detected.",
  ],
  [
    "How do status pages stay online when my origin is down?",
    "UptimeCrow pre-renders your status page as static HTML on every incident update, served decoupled from your origin. Even if your app, API and database are all down, subscribers can still read your status page.",
  ],
  [
    "How does UptimeCrow prevent false alarms?",
    "A consecutive-failure state machine. By default a monitor must fail 2 checks in a row before an incident opens, so a single network blip never pages your team. The confirmation count is configurable per monitor.",
  ],
  [
    "Can I self-host UptimeCrow?",
    "Yes. The full stack is AGPL-3.0 and runs with a single docker compose up. You bring PostgreSQL and Redis; no vendor lock-in and no data leaving your infrastructure.",
  ],
  [
    "Is UptimeCrow really free?",
    "Yes — free forever, no credit card. The free plan includes 1 status page, 10 monitors, 5-minute checks, email alerts, an uptime badge and 7-day history. Self-hosting is unlimited.",
  ],
];

const ROUTES = [
  {
    route: "/",
    title: "UptimeCrow — Open-Source Status Pages with Built-In Uptime Monitoring",
    description:
      "Open-source status pages that stay up when you're down. Built-in uptime monitoring, automatic incidents, email subscribers, and custom domains. Self-host under AGPL-3.0 or use the hosted free tier.",
    faqLd: true,
    body: `
  <h1>Status pages that stay up when you're down.</h1>
  <p class="uc-lead">Built-in monitoring, automatic incidents, and a pre-rendered
  status page that keeps answering "is it down?" while everything else is on fire.
  Open source, AGPL-3.0, self-hostable.</p>
  <p><a class="uc-cta" href="/register">Start free — no credit card</a>
     <a href="https://github.com/ozers/uptimecrow" rel="noopener">Star on GitHub</a></p>

  <h2>How it works</h2>
  <ol>
    <li><strong>Add a monitor.</strong> HTTP, TCP or keyword check on any URL or
    host. Pick the interval; GET or lightweight HEAD requests.</li>
    <li><strong>We confirm before we shout.</strong> A monitor must fail two
    consecutive checks before an incident opens, so a blip never pages you.</li>
    <li><strong>Your status page updates itself.</strong> The incident is written,
    the page is re-rendered to static HTML, and subscribers are emailed — with
    Slack, Discord and webhook alerts for your team.</li>
  </ol>

  <h2>What you get</h2>
  <ul>
    <li>Pre-rendered status pages that survive your origin going down</li>
    <li>HTTP, TCP and keyword monitors with configurable intervals</li>
    <li>Automatic incident open, update and resolve — no manual posting</li>
    <li>Email subscribers with double opt-in verification</li>
    <li>Email, Slack, Discord and custom webhook notifications</li>
    <li>Custom domains and branding on paid plans</li>
    <li>Scheduled maintenance windows and an embeddable uptime badge</li>
    <li>Self-host the whole platform with <code>docker compose up</code></li>
  </ul>

  <h2>Pricing in one line</h2>
  <p>Free ($0) — 1 status page, 10 monitors, 5-minute checks.
  Indie ($19/mo) — 5 status pages with custom domain, 50 monitors, 1-minute checks.
  Pro ($49/mo) — 10 status pages, 100 monitors, 30-second checks.
  Annual billing is two months free. Self-hosting is unlimited and free.
  <a href="/pricing">Full pricing</a>.</p>

  <h2>Where this fits</h2>
  <p>Against <strong>Uptime Kuma</strong>: Kuma has the longer protocol list and is
  probably the right answer for a private homelab dashboard. Its status page dies
  with the host it runs on; ours is served as static files, decoupled from the
  stack it reports on.</p>
  <p>Against <strong>Atlassian Statuspage</strong> ($29/mo): Statuspage has no
  monitoring at all — you post the updates yourself. UptimeCrow watches the
  services and writes the incident for you, and you can self-host the whole thing
  under AGPL-3.0.</p>

  <h2>Common questions</h2>
  ${faq.map(([q, a]) => `<h3>${q}</h3>\n  <p>${a}</p>`).join("\n  ")}`,
  },
  {
    route: "/pricing",
    title: "UptimeCrow Pricing — Free Uptime Monitoring Plans",
    description:
      "Start free with 10 monitors. Upgrade to Indie ($19/mo) for 1-minute checks, 1-year history, and Slack/Discord alerts, or Pro ($49/mo) for 30-second checks and 100 monitors.",
    body: `
  <h1>Simple pricing. No lock-in.</h1>
  <p class="uc-lead">Start free, no credit card. Every plan includes monitoring,
  automatic incidents and a public status page. Self-hosting is free and
  unlimited under AGPL-3.0.</p>

  <h2>Free — $0</h2>
  <p>Try it out. No credit card.</p>
  <ul>
    <li>1 status page</li><li>10 monitors</li><li>5-minute check intervals</li>
    <li>Email alerts</li><li>Uptime badge</li><li>7-day history</li>
  </ul>

  <h2>Indie — $19/month ($15.83/month billed annually, $190/year)</h2>
  <p>For indie hackers and solo founders.</p>
  <ul>
    <li>5 status pages + custom domain</li><li>50 monitors</li>
    <li>1-minute check intervals</li><li>Slack, Discord, webhook alerts</li>
    <li>Email subscribers</li><li>1-year history</li>
  </ul>

  <h2>Pro — $49/month ($40.83/month billed annually, $490/year)</h2>
  <p>For teams that take uptime seriously.</p>
  <ul>
    <li>10 status pages + custom domain</li><li>100 monitors</li>
    <li>30-second check intervals</li><li>1-year history</li>
    <li>Priority support</li>
  </ul>

  <h2>Team or business — talk to us</h2>
  <p>Unlimited status pages, more monitors than Pro allows, custom retention, SSO,
  a DPA or a custom invoice: team accounts are set up with us rather than through
  a self-serve checkout. Email support@uptimecrow.com and we price it with you.</p>

  <h2>Self-hosted — free</h2>
  <p>The full platform is AGPL-3.0. Run it on your own infrastructure with
  <code>docker compose up</code>: unlimited status pages, unlimited monitors, no
  feature gates. <a href="/self-host">Self-hosting guide</a>.</p>

  <h3>Do I need a credit card to start?</h3>
  <p>No. The free plan is free forever and requires no card.</p>
  <h3>Can I change plans later?</h3>
  <p>Yes — upgrade or downgrade at any time; limits apply immediately.</p>`,
  },
  {
    route: "/docs",
    title: "API Documentation — UptimeCrow Developer Docs",
    description:
      "UptimeCrow REST API reference for monitors, incidents, status pages, and maintenance windows. Full OpenAPI spec available.",
    body: `
  <h1>REST API for uptime monitoring</h1>
  <p class="uc-lead">Automate monitor creation, trigger incidents and manage
  status pages — from your CI/CD pipeline or scripts. The interactive reference
  lives at <a href="/api/docs" rel="noopener">/api/docs</a>.</p>

  <h2>Authentication — session tokens</h2>
  <p>Log in with <code>POST /api/auth/login</code> to receive a JWT, then pass it
  as a Bearer token on every request (the dashboard uses the same token as an
  HTTP-only cookie). Tokens are valid for 7 days and are scoped to your
  organization — one token manages all your monitors and status pages.</p>

  <h2>Quick start — 5 minutes to full monitoring</h2>
  <ol>
    <li><strong>Create a monitor.</strong> <code>POST /api/monitors</code> with a
    URL, check type (http, tcp or keyword) and interval.</li>
    <li><strong>Let it confirm downtime.</strong> Two consecutive failures open an
    incident automatically; you can also post one yourself with
    <code>POST /api/incidents</code>.</li>
    <li><strong>Resolve it.</strong> <code>PATCH /api/incidents/:id</code> moves an
    incident through investigating → identified → monitoring → resolved, and the
    status page is re-rendered on every change.</li>
  </ol>

  <h2>Full API surface</h2>
  <p><strong>Monitors:</strong> <code>GET /api/monitors</code>,
  <code>POST /api/monitors</code>, <code>GET /api/monitors/:id</code>,
  <code>PATCH /api/monitors/:id</code>, <code>DELETE /api/monitors/:id</code>,
  <code>GET /api/monitors/:id/checks</code>.</p>
  <p><strong>Incidents:</strong> <code>GET /api/incidents</code>,
  <code>POST /api/incidents</code>, <code>GET /api/incidents/:id</code>,
  <code>PATCH /api/incidents/:id</code>,
  <code>POST /api/incidents/:id/updates</code>.</p>
  <p><strong>Status pages:</strong> <code>GET /api/status-pages</code>,
  <code>GET /api/status-pages/:id</code>,
  <code>PUT /api/status-pages/:id/monitors</code>.</p>
  <p><strong>Maintenance:</strong> <code>GET /api/maintenance-windows</code>,
  <code>POST /api/maintenance-windows</code>,
  <code>PATCH /api/maintenance-windows/:id</code>,
  <code>DELETE /api/maintenance-windows/:id</code>.</p>
  <p><strong>Public (no auth):</strong> the status page JSON feed at
  <code>/status/&lt;slug&gt;</code> and the SVG uptime badge at
  <code>/badge/&lt;slug&gt;.svg</code>.</p>

  <p><a class="uc-cta" href="/api/docs" rel="noopener">Open the interactive API reference</a></p>`,
  },
  {
    route: "/self-host",
    title: "Self-Host UptimeCrow — Open-Source Uptime Monitoring with Docker",
    description:
      "Run UptimeCrow on your own infrastructure with a single Docker Compose command. AGPL-3.0 licensed, open-source uptime monitoring and status pages. No vendor lock-in.",
    body: `
  <h1>Run your own uptime monitor in 5 minutes.</h1>
  <p class="uc-lead">3 Docker containers. 512 MB RAM. Any VPS. Full source code
  included — fork it, extend it, or run it as-is. AGPL-3.0, telemetry off by
  default, no feature gates.</p>

  <h2>What you need</h2>
  <ul>
    <li>A VPS or machine running Docker 24+ and Docker Compose</li>
    <li>PostgreSQL 16 and Redis 7 (both come up with the compose file)</li>
    <li>Optional: Amazon SES credentials for email alerts and subscribers</li>
  </ul>

  <h2>Quick start</h2>
  <p>Clone the repository, copy <code>.env.example</code> to <code>.env</code>,
  set a strong <code>JWT_SECRET</code> and your <code>APP_URL</code>, then run
  <code>docker compose up</code>. Postgres, Redis, the API on port 3000 and the
  web app come up together; run <code>pnpm db:migrate</code> once to create the
  schema.</p>

  <h2>What runs where</h2>
  <p>One container runs the Hono API, the BullMQ worker and the web UI:
  <code>MODE=api|worker|all</code> decides which parts start, so the checker can
  still scale separately when you need it to. The UI and the API share an origin,
  so there is no CORS to configure and no reverse proxy to keep in sync. Status
  pages are pre-rendered to static files, so they keep serving even while the API
  restarts.</p>

  <h2>What is not in the open-source repository</h2>
  <p>SSO, audit log, advanced RBAC, multi-region check orchestration and SLA
  report PDFs are hosted-only. Everything needed to monitor services and publish
  status pages is in the repository.</p>

  <p><a class="uc-cta" href="https://github.com/ozers/uptimecrow" rel="noopener">Read the source on GitHub</a></p>`,
  },
  {
    route: "/changelog",
    title: "Changelog — UptimeCrow",
    description:
      "Every feature, improvement, fix, and security update we ship — in chronological order. UptimeCrow is built in the open.",
    body: `
  <h1>Changelog</h1>
  <p class="uc-lead">Every feature, improvement, fix and security update we ship,
  in chronological order. The full history lives in the
  <a href="https://github.com/ozers/uptimecrow" rel="noopener">GitHub repository</a>.</p>
  <ul>
    <li><strong>HEAD request mode</strong> — HTTP monitors can send lightweight
    HEAD requests instead of full GETs.</li>
    <li><strong>Flapping incidents reopen</strong> — a service that recovers and
    fails again reopens its incident instead of creating a duplicate.</li>
    <li><strong>Incidents grouped by monitor</strong> — repetitive incident lists
    collapse per monitor.</li>
    <li><strong>Maintenance windows</strong> — announce planned work on the status
    page and suppress alert noise.</li>
    <li><strong>Pre-rendered status pages</strong> — pages are regenerated to
    static HTML on every incident or monitor change.</li>
  </ul>`,
  },
  {
    route: "/privacy",
    title: "Privacy Policy — UptimeCrow",
    description:
      "How UptimeCrow handles your account data, monitor configurations, and subscriber lists. GDPR and CCPA rights, sub-processors (AWS, Polar), retention windows, and contact for data requests.",
    body: `
  <h1>Privacy Policy</h1>
  <h2>Data we collect</h2>
  <p><strong>Account data:</strong> email address, hashed password, organization
  name. <strong>Service data:</strong> monitor configurations, check results,
  incident timelines, status page configuration. <strong>Subscriber data:</strong>
  email addresses collected by our customers for their status page subscribers.
  <strong>Billing data:</strong> processed by our billing provider (Polar) — we
  store only the customer ID and plan tier. <strong>Technical data:</strong> IP
  address and user agent, for rate limiting and abuse prevention.</p>
  <h2>How we use data</h2>
  <p>To provide the service you signed up for, to send transactional email
  (incident alerts, password resets, subscriber confirmations) via Amazon SES, to
  enforce plan limits and prevent abuse, and to communicate service updates. We do
  not sell personal data and we do not use it for advertising.</p>
  <h2>Sub-processors</h2>
  <p>Amazon Web Services (hosting and email via SES) and Polar (billing and
  invoicing).</p>
  <h2>Your rights (GDPR / CCPA)</h2>
  <p>You can request access to, export of, or deletion of your personal data at any
  time. Email support@uptimecrow.com and we will respond within 30 days.</p>
  <h2>Data retention</h2>
  <p>Check result history is retained according to your plan (7 days on Free,
  1 year on paid plans). Account and organization data is retained until you delete
  your account. Subscriber data is retained until the subscriber unsubscribes or the
  status page is deleted.</p>`,
  },
  {
    route: "/terms",
    title: "Terms of Service — UptimeCrow",
    description:
      "The terms governing your use of UptimeCrow: acceptable use, billing and refund policy, no-warranty disclaimer, termination, and how we communicate material changes.",
    body: `
  <h1>Terms of Service</h1>
  <h2>The service</h2>
  <p>UptimeCrow provides hosted uptime monitoring and public status pages. The
  self-hosted platform is governed by the AGPL-3.0 licence instead of these terms.</p>
  <h2>Acceptable use</h2>
  <p>Monitor endpoints you own or are authorised to check. Do not use UptimeCrow to
  generate load against third-party systems; outbound requests are restricted to
  public hosts and rate limited.</p>
  <h2>Payment and refunds</h2>
  <p>Paid plans are billed monthly or annually in advance through Polar and can be
  cancelled at any time; the plan stays active until the end of the paid period.</p>
  <h2>No warranty / SLA</h2>
  <p>The hosted service is provided as-is, without an uptime guarantee on the free
  plan.</p>
  <h2>Termination and changes</h2>
  <p>Accounts that breach these terms may be suspended. Material changes to the
  terms are communicated by email before they take effect.</p>`,
  },
];

// ─── Rendering ────────────────────────────────────────────────────────────────

// Apostrophes are escaped too. They are legal raw inside a double-quoted
// attribute, but naive scrapers that accept either quote character truncate
// there — one external crawler read the landing description as 46 characters,
// stopping dead at "when you" in "when you're down".
const escapeAttr = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function replaceBetween(html, start, end, replacement) {
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from === -1 || to === -1) {
    throw new Error(`prerender: markers ${start} / ${end} not found in index.html`);
  }
  return html.slice(0, from + start.length) + replacement + html.slice(to);
}

// The replacement is always a function, never a string: copy containing "$10"
// or "$&" would otherwise be read by String.replace as a capture-group
// reference and silently corrupt the tag (the Pricing description did exactly
// that — "$10/mo" spliced group 1 back into the attribute).
function setMeta(html, selector, value) {
  const re = new RegExp(`(<meta ${selector} content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`prerender: meta ${selector} not found`);
  return html.replace(re, (_, open, close) => open + escapeAttr(value) + close);
}

function render(template, page) {
  const url = ORIGIN + (page.route === "/" ? "/" : page.route);
  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${page.title}</title>`);
  html = setMeta(html, 'name="description"', page.description);
  html = setMeta(html, 'property="og:title"', page.title);
  html = setMeta(html, 'property="og:description"', page.description);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'name="twitter:title"', page.title);
  html = setMeta(html, 'name="twitter:description"', page.description);
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    (_, open, close) => open + escapeAttr(url) + close,
  );

  // FAQPage markup belongs on the landing page only — emitting it on every
  // route is the classic way to get structured data ignored site-wide.
  if (!page.faqLd) html = replaceBetween(html, FAQ_START, FAQ_END, "");

  const shell = `
<div id="uc-static">
  <div class="uc-wrap">${nav}
  ${page.body}
  ${footer}
  </div>
</div>`;
  return replaceBetween(html, SHELL_START, SHELL_END, shell);
}

// Read the tags back and compare with what was asked for, so a substitution
// that silently mangles an attribute fails the build instead of shipping.
function verify(html, page) {
  const url = ORIGIN + (page.route === "/" ? "/" : page.route);
  const decode = (s) =>
    s?.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const got = {
    title: html.match(/<title>([^<]*)<\/title>/)?.[1],
    description: decode(
      html.match(/<meta name="description" content="([^"]*)"/)?.[1],
    ),
    canonical: decode(html.match(/<link rel="canonical" href="([^"]*)"/)?.[1]),
  };
  const want = { title: page.title, description: page.description, canonical: url };
  for (const [k, v] of Object.entries(want)) {
    if (got[k] !== v) {
      throw new Error(
        `prerender: ${page.route} ${k} mismatch\n  want: ${v}\n  got:  ${got[k]}`,
      );
    }
  }
}

const template = await readFile(path.join(DIST, "index.html"), "utf8");

for (const page of ROUTES) {
  const html = render(template, page);
  verify(html, page);
  const dir = page.route === "/" ? DIST : path.join(DIST, page.route.slice(1));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html);
  console.log(`prerendered ${page.route} → ${path.relative(DIST, path.join(dir, "index.html"))}`);
}

console.log(`prerender: ${ROUTES.length} routes written to dist/`);
