// www → apex redirects.
//
// Both hostnames answer on the production zone today, so every page exists
// twice and only the canonical tag says which one counts. This sends the
// duplicate to the real one with a 301, and is a pure function so the rules can
// be tested without standing up a server.

export function appHostFromUrl(appUrl: string | undefined): string {
  try {
    return new URL(appUrl ?? "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * The absolute URL to redirect to, or null to let the request through.
 *
 * Only the app's own `www.` host matches: customer status-page domains are
 * arbitrary hostnames handled by the custom-domain router, and redirecting
 * `www.customer.com` to `customer.com` is not ours to decide.
 */
export function wwwRedirectTarget(
  requestUrl: string,
  hostHeader: string | undefined,
  appHost: string,
  forwardedProto?: string,
): string | null {
  if (!appHost || appHost.startsWith("www.")) return null;

  const host = (hostHeader ?? "").toLowerCase().split(":")[0].trim();
  if (host !== `www.${appHost}`) return null;

  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  url.hostname = appHost;
  url.port = "";
  // Behind a proxy the internal request is http; keep the visitor on the
  // scheme they actually used.
  url.protocol = forwardedProto === "http" ? "http:" : "https:";
  return url.toString();
}
