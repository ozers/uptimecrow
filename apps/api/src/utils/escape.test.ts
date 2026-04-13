import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeUrl, sanitizeColor } from "./escape.js";

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes ampersand", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes quotes for attribute safety", () => {
    expect(escapeHtml(`" onmouseover="alert(1)`)).toBe("&quot; onmouseover=&quot;alert(1)");
    expect(escapeHtml("' onload='x")).toBe("&#39; onload=&#39;x");
  });

  it("returns empty string for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("coerces numbers safely", () => {
    expect(escapeHtml(42)).toBe("42");
  });

  it("does not double-escape — entity & becomes &amp;", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });
});

describe("sanitizeUrl", () => {
  it("allows http and https", () => {
    expect(sanitizeUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("allows mailto", () => {
    expect(sanitizeUrl("mailto:hi@example.com")).toBe("mailto:hi@example.com");
  });

  it("allows relative paths", () => {
    expect(sanitizeUrl("/logo.png")).toBe("/logo.png");
    expect(sanitizeUrl("?foo=bar")).toBe("?foo=bar");
    expect(sanitizeUrl("#section")).toBe("#section");
  });

  it("blocks javascript: scheme (case-insensitive, with whitespace)", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("JavaScript:alert(1)")).toBe("");
    expect(sanitizeUrl("  javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("\tjavascript:alert(1)")).toBe("");
  });

  it("blocks vbscript:, file:, and other unknown schemes", () => {
    expect(sanitizeUrl("vbscript:msgbox")).toBe("");
    expect(sanitizeUrl("file:///etc/passwd")).toBe("");
    expect(sanitizeUrl("gopher://example.com")).toBe("");
  });

  it("blocks data:text/html and data:image/svg", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    expect(sanitizeUrl("data:image/svg+xml;base64,xxx")).toBe("");
  });

  it("allows data: for safe image types", () => {
    expect(sanitizeUrl("data:image/png;base64,iVBORw0KGgo")).toBe("data:image/png;base64,iVBORw0KGgo");
    expect(sanitizeUrl("data:image/jpeg;base64,/9j/4AAQSkZJ")).toBe("data:image/jpeg;base64,/9j/4AAQSkZJ");
  });

  it("escapes quotes inside an otherwise valid URL", () => {
    expect(sanitizeUrl(`https://example.com/" onload="x`)).toBe("https://example.com/&quot; onload=&quot;x");
  });

  it("returns empty for null/undefined/empty", () => {
    expect(sanitizeUrl(null)).toBe("");
    expect(sanitizeUrl(undefined)).toBe("");
    expect(sanitizeUrl("")).toBe("");
    expect(sanitizeUrl("   ")).toBe("");
  });
});

describe("sanitizeColor", () => {
  it("accepts 3- and 6-digit hex", () => {
    expect(sanitizeColor("#fff")).toBe("#fff");
    expect(sanitizeColor("#00E676")).toBe("#00E676");
    expect(sanitizeColor("#abc123")).toBe("#abc123");
  });

  it("accepts safe CSS keywords (lowercased)", () => {
    expect(sanitizeColor("Red")).toBe("red");
    expect(sanitizeColor("transparent")).toBe("transparent");
  });

  it("rejects rgb()/rgba()/hsl() — not in allow-list", () => {
    // These are normally safe, but we don't parse them, so they fall back.
    // That's fine — brand color is a simple hex field in the UI.
    expect(sanitizeColor("rgb(255,0,0)")).toBe("#00e676");
  });

  it("rejects CSS-injection attempts", () => {
    expect(sanitizeColor("#fff;}body{background:url(x)}")).toBe("#00e676");
    expect(sanitizeColor("red;background:url(javascript:alert(1))")).toBe("#00e676");
    expect(sanitizeColor("expression(alert(1))")).toBe("#00e676");
  });

  it("uses caller-provided fallback on reject", () => {
    expect(sanitizeColor("nonsense", "#123456")).toBe("#123456");
  });

  it("accepts null/undefined by falling back", () => {
    expect(sanitizeColor(null)).toBe("#00e676");
    expect(sanitizeColor(undefined)).toBe("#00e676");
  });
});
