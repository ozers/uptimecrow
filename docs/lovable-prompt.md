# AI-Native Status Page — Landing Page

Build a single-page landing page for an AI-native status page SaaS product. The product monitors websites/APIs, and when downtime is detected, AI automatically writes incident reports, updates the hosted status page, notifies subscribers, and drafts postmortems — all without human intervention.

## Brand & Design Direction

- **Tone:** Developer-focused, premium, confident. Think Linear/Vercel energy — not playful, not corporate.
- **Theme:** Dark mode only. Near-black background (#050507 range), sharp green accent (#00e676) for "operational/uptime" signals, red for "down" states, amber for "AI working" states.
- **Typography:** Monospace for data/terminal elements, clean sans-serif for headlines and body. Avoid Inter/Roboto — use something distinctive like Sora, Geist, or Satoshi for headings and IBM Plex Mono or JetBrains Mono for code/data.
- **Vibe:** Refined minimalism with one bold element — a terminal-style incident timeline demo that shows the product in action. Generous whitespace, subtle noise texture on background, no generic stock illustrations.

## Page Sections (in order)

### 1. Sticky Nav
- Left: brand name placeholder "[YourBrand]" with a small pulsing green dot (like a server status indicator)
- Right: "Join Waitlist" ghost button (green border, fills green on hover)

### 2. Hero
- Small badge above headline: "● Building in public — launching soon"
- **Headline:** "Your site went down. AI handled it." — the "AI handled it." part in gradient green
- **Subheadline:** "Downtime detected → AI writes the incident report → status page updated → subscribers notified. All before you wake up."
- **Email waitlist form:** email input + "Get Early Access" green button
- Note below: "Free tier forever. No credit card required."

### 3. Terminal Demo (critical section)
A fake terminal/console window showing a real incident timeline. This is the "show don't tell" moment. It should look like a real terminal with window controls (red/amber/green dots). Content:

```
03:14:22  ▼ DOWN   api.yourapp.com — HTTP 503, response timeout
03:14:25  ● AI     Incident created: "API experiencing elevated error rates"
03:14:26  ● AI     Status page updated → investigating
03:14:30  📧 47 subscribers notified via email
03:14:31  💬 Slack alert sent to #engineering
03:31:07  ▲ UP     api.yourapp.com — 200 OK, 143ms
03:31:09  ● AI     Incident resolved. Postmortem draft ready.
03:31:10  📧 47 subscribers notified — resolved

Total downtime: 16m 45s · Human intervention: none
```

Use color coding: green for UP/resolved, red for DOWN, amber for AI actions, dim gray for timestamps.

### 4. How It Works (3 steps)
Three cards in a row:
1. "Add your endpoints" — HTTP, TCP, webhook. Ping every 30s from multiple regions.
2. "AI manages incidents" — Downtime → AI creates incident, writes status update, posts to status page.
3. "Subscribers stay informed" — Email, Slack, webhook notifications. AI writes postmortem draft when resolved.

### 5. Features Grid (2 columns, 6 items)
- 🤖 AI Incident Reports — AI writes clear, professional updates, not generic "we're investigating"
- 📡 Global Monitoring — HTTP/TCP/webhook, 30s intervals, multi-region, sub-minute detection
- 🎨 Beautiful Status Pages — Custom domain, clean design, branded, fast
- 📧 Subscriber Notifications — Email + Slack, self-serve subscribe, zero friction
- 📝 Postmortem Drafts — AI drafts timeline, impact summary, root cause template
- ⏱️ Uptime Badge — Embeddable "99.98% uptime" badge for sites, READMEs, docs

### 6. Comparison Table
Compare [YourBrand] vs Betterstack vs Instatus vs Statuspage.io across:
- AI incident reports: ✓ (us only) vs ✗ vs ✗ vs ✗
- AI postmortem drafts: ✓ (us only) vs ✗ vs ✗ vs ✗  
- Auto status page update: ✓ (us only, others are manual)
- Uptime monitoring: all ✓ (Statuspage.io is add-on)
- Custom domain: all ✓
- Free tier: ✓ forever free (us), trial only (Betterstack), ✓ (Instatus), ✗ (Statuspage.io)
- Starting price: $19/mo (us) vs $24/mo vs $20/mo vs $79/mo

Highlight our column with a subtle green background tint.

### 7. Pricing (3 tiers)
- **Free ($0/mo):** 1 status page, 3 monitors, 5-min intervals, manual incident management, email notifications, uptime badge. NO AI — AI is the upgrade hook.
- **Pro ($19/mo) — mark as POPULAR:** 3 status pages, 20 monitors, 30s intervals, AI incident reports, AI postmortem drafts, custom domain, Slack + webhook, uptime badge, 2 team seats
- **Team ($49/mo):** Everything in Pro + unlimited status pages, 50 monitors, multi-region checks, 5 team seats, API access, priority support

### 8. Final CTA
- Headline: "Stop writing incident reports at 3 AM."
- Subtitle: "Join the waitlist. Be first to know when we launch."
- Same email waitlist form as hero

### 9. Footer
Simple, one line: "© 2026 [YourBrand]. Built with care in Istanbul."

## Technical Notes
- Single page, fully responsive
- Email form just needs to capture the email — wire to any backend later (for now console.log is fine)
- All [YourBrand] occurrences should be easy to find-and-replace when the name is chosen
- Add subtle fade-up animations on scroll for sections
- The terminal demo should feel alive — consider a subtle typing animation or sequential line reveal
- The green pulsing dot in the nav should have a soft glow animation
- No images needed — the terminal demo IS the visual hero

## What NOT to do
- No generic hero illustrations or abstract shapes
- No purple gradients
- No testimonials section (we don't have users yet)
- No "trusted by" logos
- No chatbot or live chat widget
- Don't make it look like every other SaaS template
