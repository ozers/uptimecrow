import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown.js";

describe("renderMarkdown", () => {
  it("returns empty string for null / undefined / empty input", () => {
    expect(renderMarkdown(null)).toBe("");
    expect(renderMarkdown(undefined)).toBe("");
    expect(renderMarkdown("")).toBe("");
  });

  it("escapes HTML before applying markdown", () => {
    const out = renderMarkdown("<script>alert(1)</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("renders bold", () => {
    expect(renderMarkdown("this is **bold** text")).toContain("<strong>bold</strong>");
  });

  it("renders italic", () => {
    expect(renderMarkdown("this is *italic* text")).toContain("<em>italic</em>");
  });

  it("renders inline code", () => {
    expect(renderMarkdown("run `pnpm install` now")).toContain("<code>pnpm install</code>");
  });

  it("renders safe links with target and rel", () => {
    const out = renderMarkdown("see [docs](https://example.com) for more");
    expect(out).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a>');
  });

  it("strips javascript: URLs — shows only the label as plain text", () => {
    const out = renderMarkdown("see [docs](javascript:alert(1)) for more");
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<a ");
    expect(out).toContain("docs");
  });

  it("escapes quotes inside link URLs", () => {
    const out = renderMarkdown(`[label](https://example.com/"x)`);
    expect(out).toContain("&quot;x");
    expect(out).not.toContain('onload="');
  });

  it("builds a <ul> from dash bullets", () => {
    const out = renderMarkdown("- one\n- two");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>one</li>");
    expect(out).toContain("<li>two</li>");
    expect(out).toContain("</ul>");
  });

  it("builds an <ol> from numbered items", () => {
    const out = renderMarkdown("1. first\n2. second");
    expect(out).toContain("<ol>");
    expect(out).toContain("<li>first</li>");
  });

  it("wraps paragraphs and turns single newlines into <br>", () => {
    const out = renderMarkdown("line one\nline two\n\nsecond para");
    expect(out).toContain("<p>line one<br>line two</p>");
    expect(out).toContain("<p>second para</p>");
  });

  it("does not leave unclosed tags when markdown is mixed", () => {
    const out = renderMarkdown("Before\n\n- bullet\n\nAfter");
    expect(out).toContain("<ul>");
    expect(out).toContain("</ul>");
    expect((out.match(/<ul>/g) ?? []).length).toBe((out.match(/<\/ul>/g) ?? []).length);
  });
});
