---
title: "UptimeCrow's free plan just got 2.5× bigger — here's why and what's coming"
slug: free-plan-bigger
date: 2026-05-19
author: Ozer Subasi
canonical: https://uptimecrow.com/blog/free-plan-bigger
description: Why we just bumped UptimeCrow's free tier from 10 monitors to 25, what shipped this week, and what we're deliberately not building.
---

# UptimeCrow's free plan just got 2.5× bigger — here's why and what's coming

Most uptime monitors race to the bottom on their free tier just enough to look generous, then yank features the moment you have anything real to monitor. UptimeRobot Free gives you 50 monitors but checks every 5 minutes. BetterStack gives you 10 and pushes you to a $29/mo plan fast. Pingdom doesn't have a free tier at all.

I sat down this weekend, looked at our numbers, and realized our 10-monitor / 30-day free tier was the bottleneck — not the product. So I changed it.

**Free plan, as of today:**

- **25 monitors** (was 10)
- **60-day history** (was 30)
- **5 heartbeat monitors** (was 3)
- Everything else stays: 1-minute checks, 1 status page, automatic incidents, Slack/Discord, MCP server, uptime badge, all for $0.

No credit card. Permanent free tier, not a trial.

## Why now

The honest answer: I'm solo, bootstrapped, and the math on indie SaaS is brutal. Customer acquisition for a developer tool isn't a feature problem — it's a *trust* problem. People won't migrate from UptimeRobot (12 years old, 3.2M users) unless I make the cost of trying near zero and the surface area of the comparison undeniable.

The 10-monitor cap was making people bounce on the pricing page. 25 is enough for a serious indie hacker, a small SaaS, or a dev team's "personal stuff" tier. If you grow past 25, you're probably ready to pay $12/mo for the Indie plan anyway.

I'd rather have 1,000 people happily on the free tier and 50 of them upgrading than have 100 people on a stingy free tier and nobody upgrading because they never got far enough to need more.

## What else shipped this week

While I was in there, I shipped three more things:

**1. Slow-response alerts.** Every monitor now has an optional response-time threshold (e.g. 2000ms). When a successful check exceeds it, you get an email + Slack/Discord notification. The state machine still treats the monitor as "up" — slow isn't down — but you find out *before* customers do. UptimeRobot sells this as "Slow Response Alerts" on their paid plans. Yours is free.

**2. Three free public tools, no signup:**

- [SSL Certificate Checker](https://uptimecrow.com/tools/ssl-checker) — issuer, expiry, validity dates
- [DNS Lookup](https://uptimecrow.com/tools/dns-lookup) — A, AAAA, MX, TXT, NS, CNAME
- [Uptime Tester](https://uptimecrow.com/tools/uptime-test) — one-shot HTTP check with response time, soft-404 detection, slow-response warnings

These run the exact same check engine that powers UptimeCrow's monitoring. They're also bait — if you find yourself hitting "check SSL" three times a day, you probably want continuous monitoring instead.

**3. A [public changelog](https://uptimecrow.com/changelog).** Every feature, every fix, every security update. Newest first. Building in the open is more accountability than marketing.

## What I'm deliberately *not* building

A reader of the [UptimeRobot comparison report](https://uptimecrow.com/vs/uptimerobot) might point out that UptimeRobot supports Ping (ICMP), UDP, DNS-record monitors, mobile apps, Zapier connectors, and voice-call alerts. UptimeCrow doesn't.

I'm not going to build most of them. Here's why:

- **Ping/ICMP** requires raw sockets, which in Docker requires NET_RAW capability and a bunch of operational pain. Two percent of users would ever use it. The free tools above include a DNS lookup that covers the most common "is my host reachable" debugging case.
- **Mobile app** is a fulltime project. A progressive web app with push notifications gets you 80% of the value for 5% of the effort, and it's on the roadmap, not the backlog.
- **Zapier connector** would help, but UptimeCrow already has custom webhooks + a native MCP server. If you can't wire UptimeCrow into your stack with those, Zapier isn't going to save you.
- **SOC 2** when I have ten paying customers is theater. When I have a hundred enterprise leads, I'll start the audit.

A solo founder's most important skill isn't choosing what to build — it's choosing what to *not* build, on purpose, and publishing the reasoning.

## What I am building next

The two things on the active queue:

1. **On-call escalation with SMS acknowledge.** UptimeCrow already has on-call rotation; the next step is multi-tier escalation (5 min unack → secondary contact) and SMS reply-to-ack. This is the one feature UptimeRobot has *outsourced* to PagerDuty — building it into the same tool is a legitimate differentiator. ETA: 2-3 weeks.

2. **More /vs/* comparison pages and migration guides.** Most of UptimeCrow's traffic comes from people searching "alternative to X" or "X vs Y". I'm working through Healthchecks.io and StatusCake this week, and a step-by-step UptimeRobot migration guide is the next thing I write after this post.

## How to try it

If you've never used UptimeCrow: [sign up free](https://uptimecrow.com/register), no card.

If you have an UptimeRobot/Healthchecks/StatusCake setup you're tired of: the next post is your migration guide. Or just hit me on Twitter/X — I read every reply.

If you want to self-host: [the entire stack is AGPL-3.0 licensed on GitHub](https://github.com/ozers/uptimecrow). `docker compose up` and you're done.

If you want to follow along: [the changelog](https://uptimecrow.com/changelog) is the canonical source.

---

*UptimeCrow is open-source uptime monitoring and status pages, built in Istanbul by one person. The free plan now includes 25 monitors, 5 heartbeats, 60-day history, and the only native MCP server in the category. [Start free](https://uptimecrow.com/register).*

---

## Distribution variants

### Twitter / X / Bluesky thread (paste each line as a separate post)

> 1/ Most uptime monitors race to the bottom on their free tier.
>
> UptimeRobot: 50 monitors but 5-minute checks.
> BetterStack: 10 monitors, fast paywall.
> Pingdom: no free tier at all.
>
> I bumped UptimeCrow's free tier 2.5× today. Here's the math.

> 2/ Old free plan: 10 monitors, 3 heartbeats, 30-day history.
> New free plan: **25 monitors, 5 heartbeats, 60-day history.**
>
> Everything else stays — 1-min checks, MCP server, status page, all integrations. Permanent. No card.

> 3/ Why?
>
> I'm solo + bootstrapped. The 10-monitor cap was making people bounce on the pricing page before they could see what the product does.
>
> Better to have 1k happy free users (50 upgrade) than 100 stingy ones (0 upgrade).

> 4/ Also shipped this week:
>
> - Slow-response alerts (UptimeRobot sells this on paid plans)
> - 3 free public tools: SSL checker, DNS lookup, uptime tester
> - Public changelog
>
> Links: uptimecrow.com/tools and uptimecrow.com/changelog

> 5/ What I'm NOT building:
>
> - Ping/ICMP (Docker pain, 2% of users)
> - Mobile app (PWA instead)
> - Zapier (we have webhooks + MCP)
> - SOC 2 audit (theater until I have real enterprise leads)
>
> Solo founder skill #1: deliberately not building things.

> 6/ Next on the queue:
>
> - On-call escalation with SMS acknowledge (UptimeRobot outsources this to PagerDuty — building it native is a real diff)
> - UptimeRobot migration guide
> - More /vs/* pages
>
> Building in the open. Follow along: uptimecrow.com/changelog

### IndieHackers post (paste as-is)

**Title:** I bumped my uptime monitor's free tier 2.5× this week. Here's why.

(Then paste the body of the post, drop the "How to try it" section, end with a question to invite replies — e.g. "What's the smallest tier you've seen that *actually* converts to paid? My old 10-monitor cap converted ~0.5%; let's see what 25 does.")

### Dev.to / Hashnode cross-post

Use the canonical link to your own blog: `<link rel="canonical" href="https://uptimecrow.com/blog/free-plan-bigger" />` (Dev.to has a canonical field in the post settings — set it).

### Reddit (r/selfhosted, r/devops, r/indiehackers)

Don't paste the full post. Write a 2-3 sentence personal note + link. Example for r/selfhosted:

> Hey r/selfhosted — I run an open-source uptime monitor (AGPL-3.0, runs on docker compose). Just bumped the cloud version's free tier 2.5× because the old cap was making people bounce. Writing about why and what else I'm not building. Self-hosters can ignore the cloud tier change — the OSS is unchanged, but the slow-response alerts and free SSL/DNS tools are new.
> [link to blog post]

Avoid r/devops if your karma is fresh — they downvote anything that smells promotional within 5 minutes.

### Hacker News

**Don't post this one to HN.** Save your HN shot for the Show HN in week 4, when you have a stronger headline ("Show HN: UptimeCrow — open-source uptime + native MCP server, free for 25 monitors"). Posting a "we changed our pricing" story to HN burns goodwill.
