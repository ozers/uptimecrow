# Landing concept mockups

Throwaway, **standalone HTML** hero concepts to pick a more distinctive,
animated direction for the landing page. No build step — just open the files in
a browser:

```
open docs/landing-concepts/concept-1-pulse.html
open docs/landing-concepts/concept-2-command-center.html
open docs/landing-concepts/concept-3-kinetic.html
```

(or drag the file into a browser tab). Each is one full hero section.

## The shared idea

Two brand problems the current site has:

1. **Green is the brand AND the status colour** (`--primary` and `--success` are
   the same hue 151). Every monitoring tool is green — UptimeCrow blends in.
2. **No motion / signature.** The look is clean but static; nothing says "live,
   watchful" — which is literally the product.

So all three concepts:
- **Reserve green for STATUS only** (up / uptime / "alive" pulse).
- Use a **decoupled brand accent** (violet `#7c5cff` here as a placeholder — easy
  to retune) for CTAs / logo / links.
- Add **one signature motion** tied to the product's core loop (catch the dip).

## The three directions

| | Concept | Vibe | Best if… |
|---|---|---|---|
| **1** | **The Pulse** | Live EKG/heartbeat line that runs green, plunges red on an incident, recovers. The status pill narrates it. | You want the hero to *be* the product — data-viz, mesmerising, unmistakably "uptime". **(My pick.)** |
| **2** | **Command Center** | Dark ops panel: radar sweep + monitor chips; one drops, a toast fires "incident opened → resolved". | You want to show the automatic incident loop as a live demo. |
| **3** | **Kinetic** | Editorial big type: "down" glitches red, "caught" snaps green. Restrained, brand-forward. | You want a bold, distinctive brand statement over a product demo. |

## Recommendation

**Concept 1 (Pulse)** is the most ownable: no competitor leads with a live
uptime waveform, it's on-brand ("we caught it first"), and it reuses green
*semantically* (alive=green, incident=red) so it differentiates without fighting
the status palette. Concept 2 is the strongest runner-up and they could even
combine (Pulse hero + Command-Center section lower down).

Pick a direction (and retune the violet to taste — it's one CSS var: `--brand`),
and I'll port the winner into the real `Landing.tsx` / `Landing.css` properly
(responsive, reduced-motion fallback, light/dark).

> Accessibility: the final port will respect `prefers-reduced-motion` (pause the
> pulse / glitch) — these mockups don't yet.
