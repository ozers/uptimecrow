// Thin wrapper around our analytics trackers (Umami + PostHog).
// Falls back to no-op when a script hasn't loaded (dev, no env var).

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
    };
    posthog?: {
      capture: (event: string, data?: Record<string, unknown>) => void;
      identify: (id: string, props?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

function track(event: string, data?: Record<string, string | number | boolean>) {
  try {
    window.umami?.track(event, data);
  } catch {
    // never throw from analytics
  }
  try {
    window.posthog?.capture(event, data);
  } catch {
    // never throw from analytics
  }
}

// Tie subsequent events to a user (PostHog). Pageviews are autocaptured.
function identify(userId: string, props?: Record<string, unknown>) {
  try {
    window.posthog?.identify(userId, props);
  } catch {
    // never throw from analytics
  }
}

function reset() {
  try {
    window.posthog?.reset();
  } catch {
    // never throw from analytics
  }
}

export const analytics = {
  // Auth
  register: () => track("register"),
  login: (method: "email" | "google") => track("login", { method }),

  // Monitors
  monitorCreated: (type: string) => track("monitor_created", { type }),
  monitorDeleted: () => track("monitor_deleted"),
  monitorTested: () => track("monitor_tested"),

  // Incidents
  incidentCreated: (severity: string) => track("incident_created", { severity }),
  incidentResolved: () => track("incident_resolved"),

  // Status pages
  statusPageCreated: () => track("status_page_created"),

  // Heartbeats
  heartbeatCreated: () => track("heartbeat_created"),

  // Team
  inviteSent: () => track("invite_sent"),
  inviteAccepted: () => track("invite_accepted"),

  // Integrations
  integrationSaved: (type: string) => track("integration_saved", { type }),
  integrationTested: (type: string) => track("integration_tested", { type }),

  // Navigation / conversion
  pricingViewed: () => track("pricing_viewed"),
  docsViewed: () => track("docs_viewed"),
  upgradeClicked: (plan: string) => track("upgrade_clicked", { plan }),
  checkoutStarted: (plan: string) => track("checkout_started", { plan }),

  // Identity (PostHog) — call on login/register, reset on logout.
  identify,
  reset,

  // Raw passthrough
  track,
};
