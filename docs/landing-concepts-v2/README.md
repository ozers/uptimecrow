# Landing redesign — true to the product's nature

The first round of concepts (PR #17: pulse / radar / glitch + GSAP) was a miss —
too flashy for what UptimeCrow *is*. This is a **reliability** product. The
landing has to feel **calm, precise, and trustworthy**; frantic animation
actively undermines the "we keep you stable" promise and the technical
credibility this audience buys on.

```
open docs/landing-concepts-v2/calm-product-led.html
```

## Principles (the project's nature)

- **Calm = trust.** A monitoring tool that looks restless contradicts itself. At
  most one slow, quiet signal (the "operational" pulse). No spectacle.
- **Show the real product.** Like Linear / Vercel / Sentry, the hero *is* the
  product — a clean, real status-page panel — not abstract effects. The proof is
  the UI itself.
- **Developer-grade craft.** Distinctiveness comes from precision: tight
  typography, tabular monospace data, hairline grid, exact spacing — not motion.
- **Open source, front and centre.** GitHub stars, AGPL, `docker compose up`,
  "self-host unlimited" — the things competitors can't say. This is the real
  differentiator, and it's honest.
- **Green stays the brand** — but as *operational/signal*, used with restraint.
  For a monitoring tool that's on-nature, not generic, when the craft is high.

## What's in the mockup

A two-column hero: confident, honest copy on the left (open-source framing in the
specs row); the **actual product** on the right — a calm status-page card with a
single slow "operational" pulse and precise, tabular uptime sparklines. One
motion only. Everything else is stillness and precision.

Open it next to the current landing. If the register is right, I'll port it into
`Landing.tsx` / `Landing.css` properly (responsive, light/dark,
`prefers-reduced-motion`) and we can retune type/spacing/accent from there.

(PR #17's animated concepts are superseded — close it.)
