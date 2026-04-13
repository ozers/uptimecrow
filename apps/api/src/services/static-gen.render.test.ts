import { describe, it, expect } from "vitest";
import { renderStatusHtml, type StaticStatusPage } from "./static-gen.service.js";

function baseData(overrides: Partial<StaticStatusPage> = {}): StaticStatusPage {
  return {
    generatedAt: "2026-04-13T12:00:00.000Z",
    statusPage: {
      name: "Acme",
      slug: "acme",
      logoUrl: null,
      brandColor: "#00e676",
    },
    overallStatus: "operational",
    monitors: [],
    activeIncidents: [],
    ...overrides,
  };
}

describe("renderStatusHtml — XSS", () => {
  it("escapes <script> in the status page name", () => {
    const html = renderStatusHtml(baseData({
      statusPage: {
        name: `<script>window.xssed=true</script>`,
        slug: "x",
        logoUrl: null,
        brandColor: "#00e676",
      },
    }));
    expect(html).not.toContain("<script>window.xssed=true</script>");
    expect(html).toContain("&lt;script&gt;window.xssed=true&lt;/script&gt;");
  });

  it("escapes attribute-breaking quotes in a monitor name", () => {
    const html = renderStatusHtml(baseData({
      monitors: [{
        name: `" onclick="alert(1)`,
        status: "up",
        lastCheckedAt: null,
        uptimePercent: "99.99",
      }],
    }));
    expect(html).not.toContain(`" onclick="alert(1)`);
    expect(html).toContain("&quot; onclick=&quot;alert(1)");
  });

  it("escapes HTML inside an incident title", () => {
    const html = renderStatusHtml(baseData({
      activeIncidents: [{
        id: "i1",
        title: `<img src=x onerror=alert(1)>`,
        status: "investigating",
        severity: "minor",
        startedAt: "2026-04-13T11:00:00.000Z",
        updates: [],
      }],
    }));
    expect(html).not.toMatch(/<img src=x onerror=alert\(1\)>/);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes HTML inside an incident update body", () => {
    const html = renderStatusHtml(baseData({
      activeIncidents: [{
        id: "i1",
        title: "API down",
        status: "identified",
        severity: "major",
        startedAt: "2026-04-13T11:00:00.000Z",
        updates: [{
          status: "identified",
          body: `<svg/onload=alert('xss')>`,
          createdAt: "2026-04-13T11:30:00.000Z",
        }],
      }],
    }));
    expect(html).not.toContain("<svg/onload=alert('xss')>");
    expect(html).toContain("&lt;svg/onload=alert(&#39;xss&#39;)&gt;");
  });

  it("rejects javascript: URLs in logoUrl", () => {
    const html = renderStatusHtml(baseData({
      statusPage: {
        name: "Acme",
        slug: "acme",
        logoUrl: "javascript:alert(1)",
        brandColor: "#00e676",
      },
    }));
    expect(html).not.toContain("javascript:alert(1)");
    // Since sanitizeUrl returns "", the <img> tag is not rendered at all.
    expect(html).not.toMatch(/<img[^>]*src="javascript/i);
  });

  it("preserves a safe https logo URL", () => {
    const html = renderStatusHtml(baseData({
      statusPage: {
        name: "Acme",
        slug: "acme",
        logoUrl: "https://cdn.example.com/logo.png",
        brandColor: "#00e676",
      },
    }));
    expect(html).toContain(`src="https://cdn.example.com/logo.png"`);
  });

  it("escapes HTML inside maintenance window title and body", () => {
    const html = renderStatusHtml(baseData({
      maintenanceWindows: [{
        id: "m1",
        title: `<script>alert('title')</script>`,
        body: `<img src=x onerror=alert('body')>`,
        status: "in_progress",
        scheduledStart: "2026-04-13T10:00:00.000Z",
        scheduledEnd: "2026-04-13T14:00:00.000Z",
        isActive: true,
      }],
    }));
    expect(html).not.toContain("<script>alert('title')</script>");
    expect(html).not.toContain("<img src=x onerror=alert('body')>");
    expect(html).toContain("&lt;script&gt;alert(&#39;title&#39;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(&#39;body&#39;)&gt;");
  });

  it("falls back to the default brand color on CSS-injection attempt", () => {
    const html = renderStatusHtml(baseData({
      statusPage: {
        name: "Acme",
        slug: "acme",
        logoUrl: null,
        brandColor: "red;}body{background:url(x)",
      },
    }));
    expect(html).not.toContain("background:url(x)");
    expect(html).toContain("--brand:#00e676");
  });
});
