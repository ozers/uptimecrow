import { escapeHtml, sanitizeUrl } from "./escape.js";

// Tiny, safe-by-construction markdown renderer for incident bodies. Escapes
// HTML first, then promotes a small whitelist of markdown constructs. No
// user-supplied HTML ever reaches the output — so even if the markdown spec
// were extended, XSS cannot sneak in.
//
// Supported syntax:
//   **bold**  *italic*  `code`
//   [label](https://url)
//   - bullet
//   1. ordered
//   paragraph breaks (blank line)
//   single newlines become <br>
export function renderMarkdown(input: string | null | undefined): string {
  if (!input) return "";

  // Extract links from the raw input first so we can let sanitizeUrl + a
  // scoped escapeHtml handle URL and label escaping independently, then
  // re-insert them after the global escape pass. Stops double-escaping.
  const placeholders: string[] = [];
  const SENTINEL = (i: number) => `\u0000LINK${i}\u0000`;
  let text = input.replace(
    /\[([^\]\n]+)\]\(([^)\n]+)\)/g,
    (_match, label: string, url: string) => {
      const safe = sanitizeUrl(url);
      if (!safe) return escapeHtml(label);
      const idx = placeholders.length;
      placeholders.push(
        `<a href="${safe}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
      );
      return SENTINEL(idx);
    },
  );

  text = escapeHtml(text);
  text = text.replace(/\u0000LINK(\d+)\u0000/g, (_match, idx: string) => placeholders[Number(idx)] ?? "");

  // Inline code
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // Bold then italic (bold first so the inner single-asterisk pairs don't win)
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // Bullet & ordered lists. Line-based; groups adjacent list items.
  const lines = text.split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  for (const line of lines) {
    const bullet = /^\s*-\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (bullet) {
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${bullet[1]}</li>`);
    } else if (ordered) {
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${ordered[1]}</li>`);
    } else {
      closeList();
      out.push(line);
    }
  }
  closeList();
  text = out.join("\n");

  // Paragraphs: split on blank line, wrap non-list/non-empty chunks, turn
  // single newlines into <br>.
  const blocks = text.split(/\n{2,}/).map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (/^<(ul|ol|li|\/ul|\/ol)/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
  });

  return blocks.filter(Boolean).join("\n");
}
