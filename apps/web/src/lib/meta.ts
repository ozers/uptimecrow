import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object | object[];
}

const DEFAULT_TITLE =
  "UptimeCrow — Uptime Monitoring & Status Pages for Developers";
const DEFAULT_DESC =
  "Monitor your APIs and websites, alert on incidents, and serve pre-rendered status pages that stay online even when your origin goes down. Developer-first, open-source core.";
const DEFAULT_CANONICAL = "https://uptimecrow.com/";

const DEFAULT_SOFTWARE_APP_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "UptimeCrow",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Open-source uptime monitoring and status page platform. Monitor HTTP endpoints, get alerted on incidents, and serve pre-rendered status pages that stay online when your origin goes down.",
  url: "https://uptimecrow.com",
  softwareVersion: "1.0",
  license: "https://opensource.org/licenses/MIT",
  author: {
    "@type": "Organization",
    name: "UptimeCrow",
  },
};

export function usePageMeta({ title, description, canonical, jsonLd }: PageMeta) {
  useEffect(() => {
    document.title = title;

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (link && canonical) link.href = canonical;

    // Inject page-specific JSON-LD (or fall back to default SoftwareApplication schema)
    document.getElementById("__page_ld__")?.remove();
    const ld = jsonLd ?? DEFAULT_SOFTWARE_APP_LD;
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "__page_ld__";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("name", "description", DEFAULT_DESC);
      setMeta("property", "og:title", DEFAULT_TITLE);
      setMeta("property", "og:description", DEFAULT_DESC);
      setMeta("name", "twitter:title", DEFAULT_TITLE);
      setMeta("name", "twitter:description", DEFAULT_DESC);
      if (link) link.href = DEFAULT_CANONICAL;
      document.getElementById("__page_ld__")?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function setMeta(attr: string, value: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.content = content;
}
