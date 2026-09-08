/**
 * Ready-made incident update copy.
 *
 * During an outage the most expensive thing to produce is prose: the person is
 * trying to fix the problem and decide what to tell customers at the same time.
 * These templates turn a thirty-second writing task into a three-second one.
 *
 * Tone rules:
 *  · No blame, no excuses. What we know, what we are doing, when we write next.
 *  · No internal detail ("the Redis connection pool was exhausted" becomes "an
 *    infrastructure issue").
 *  · Never promise a specific window — "as soon as we know more" instead of
 *    "within 30 minutes", because that promise is the one that gets broken.
 *  · The service name is filled in automatically; the writer only corrects it
 *    when it reads wrong.
 */
export type IncidentUpdateStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface UpdateTemplate {
  id: string;
  /** Short label shown on the template button. */
  label: string;
  /** The status this template implies — picking it also sets the Status field. */
  status: IncidentUpdateStatus;
  /** The `{service}` placeholder is replaced with the monitored service name. */
  body: string;
}

export const UPDATE_TEMPLATES: UpdateTemplate[] = [
  {
    id: "investigating",
    label: "Investigating",
    status: "investigating",
    body:
      "We're aware of an issue affecting {service} and are investigating. " +
      "We'll post an update as soon as we know more.",
  },
  {
    id: "identified",
    label: "Cause found",
    status: "identified",
    body:
      "We've identified the cause of the issue affecting {service} and are working on a fix. " +
      "We'll update this page when the fix is deployed.",
  },
  {
    id: "monitoring",
    label: "Fix deployed",
    status: "monitoring",
    body:
      "A fix has been deployed and {service} is responding normally again. " +
      "We're monitoring closely before we mark this as resolved.",
  },
  {
    id: "resolved",
    label: "Resolved",
    status: "resolved",
    body:
      "{service} has been operating normally for the last few minutes and this incident is now resolved. " +
      "Thanks for your patience.",
  },
];

/** Fills the `{service}` placeholder, falling back to neutral wording. */
export function fillTemplate(template: UpdateTemplate, serviceName?: string | null): string {
  return template.body.replace(/\{service\}/g, serviceName?.trim() || "this service");
}

/**
 * When to offer closing an incident by itself.
 *
 * Once the service has been continuously up for long enough, suggest resolving.
 * The decision stays human: the UI shows an "Auto-resolve in 45m" countdown the
 * person can cancel. This function only decides whether the offer appears and
 * how much time is left on it.
 */
export const AUTO_RESOLVE_AFTER_UP_MS = 15 * 60 * 1000; // stable and up this long
export const AUTO_RESOLVE_GRACE_MS = 45 * 60 * 1000; // countdown before it closes

export function autoResolveState(params: {
  /** When the monitor came back up (ISO), or null while it is still down. */
  recoveredAt: string | null | undefined;
  /** Injectable clock, so the countdown is testable. */
  now?: number;
}): { suggest: boolean; msRemaining: number } {
  const { recoveredAt, now = Date.now() } = params;
  if (!recoveredAt) return { suggest: false, msRemaining: 0 };
  const upFor = now - new Date(recoveredAt).getTime();
  if (upFor < AUTO_RESOLVE_AFTER_UP_MS) return { suggest: false, msRemaining: 0 };
  const remaining = AUTO_RESOLVE_AFTER_UP_MS + AUTO_RESOLVE_GRACE_MS - upFor;
  return { suggest: remaining > 0, msRemaining: Math.max(0, remaining) };
}

/** 2_700_000 → "45m", 90_000 → "1m 30s" */
export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 10) return `${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
