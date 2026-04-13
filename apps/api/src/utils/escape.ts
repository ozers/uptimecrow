// HTML/attribute/URL/CSS escaping for user-controlled values rendered into
// pre-generated status pages. All functions return safe strings that are
// acceptable in the stated context — no partial escaping, no trust in callers.

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: unknown): string {
  if (input == null) return "";
  return String(input).replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

// escapeAttr is identical to escapeHtml for standard double-quoted attribute
// contexts. Exported as a separate name so call sites document intent.
export const escapeAttr = escapeHtml;

// sanitizeUrl returns a string that is safe to drop into an href/src attribute.
// Rejects javascript:, data: (except data:image/*), vbscript:, file:, etc.
// Returns empty string for any rejected or malformed input.
export function sanitizeUrl(input: unknown): string {
  if (input == null) return "";
  const raw = String(input).trim();
  if (!raw) return "";

  // Allow relative URLs — no scheme means same-origin.
  if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("?")) {
    return escapeAttr(raw);
  }

  // Parse scheme.
  const colon = raw.indexOf(":");
  if (colon === -1) return escapeAttr(raw); // protocol-relative or bare
  const scheme = raw.slice(0, colon).toLowerCase().trim();

  if (scheme === "http" || scheme === "https" || scheme === "mailto") {
    return escapeAttr(raw);
  }

  // Narrow data: allowance — only common image MIME types, no SVG (SVG can host scripts).
  if (scheme === "data") {
    if (/^data:image\/(png|jpeg|jpg|gif|webp);/i.test(raw)) {
      return escapeAttr(raw);
    }
    return "";
  }

  return "";
}

// sanitizeColor returns a CSS-safe color token. Only #rgb / #rrggbb hex and a
// small allow-list of color keywords pass; everything else falls back to the
// provided default (which must itself be safe). Prevents CSS injection through
// the brand-color field.
const SAFE_COLOR_NAMES = new Set([
  "black", "white", "red", "green", "blue", "yellow", "orange", "purple",
  "pink", "gray", "grey", "cyan", "magenta", "transparent", "currentcolor",
]);

export function sanitizeColor(input: unknown, fallback = "#00e676"): string {
  if (input == null) return fallback;
  const raw = String(input).trim();
  if (/^#[0-9a-f]{3}$/i.test(raw) || /^#[0-9a-f]{6}$/i.test(raw)) {
    return raw;
  }
  if (SAFE_COLOR_NAMES.has(raw.toLowerCase())) {
    return raw.toLowerCase();
  }
  return fallback;
}
