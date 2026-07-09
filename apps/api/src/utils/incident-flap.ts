// Flapping incidents: a monitor that recovers then fails again within a short
// window is the same incident bouncing, not a new one. The check job reopens
// the just-resolved incident instead of creating a duplicate.

// A monitor that recovers then fails again within this window reopens its
// previous incident rather than opening a fresh one.
export const FLAP_COOLDOWN_MS = 15 * 60 * 1000;

// True when a just-resolved incident is recent enough that the next failure
// should reopen it rather than open a fresh one.
export function isWithinFlapCooldown(
  resolvedAt: Date | null,
  now: number,
  cooldownMs = FLAP_COOLDOWN_MS,
): boolean {
  if (!resolvedAt) return false;
  return now - resolvedAt.getTime() < cooldownMs;
}
