// Thin wrapper around Umami's window.umami tracker.
// Falls back to no-op when the script hasn't loaded (dev, no env var).

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

function track(event: string, data?: Record<string, string | number | boolean>) {
  try {
    window.umami?.track(event, data);
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

  // Raw passthrough
  track,
};
