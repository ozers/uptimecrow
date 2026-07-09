const DAY_MS = 24 * 60 * 60 * 1000;

// Whole days remaining until `expiresAt`, counted from `now`.
//
// Uses floor, not round: "days remaining" means *full* days left. A cert
// expiring in 40 hours has 1 full day left (not ~2). This is the semantics
// the expiry-warning notifications fire on, and the dashboard must match it —
// rounding would show "2d" while under two full days actually remain, and
// disagree with when the warning email is sent.
//
// Returns a negative number once the timestamp is in the past (already
// expired), so callers can treat `< 0` as expired.
export function daysUntil(expiresAt: Date, now: Date = new Date()): number {
  return Math.floor((expiresAt.getTime() - now.getTime()) / DAY_MS);
}
