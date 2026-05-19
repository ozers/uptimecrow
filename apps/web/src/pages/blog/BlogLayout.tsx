import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "../Landing.css";
import { usePageMeta } from "@/lib/meta";
import { MarketingLayout } from "@/components/layout/MarketingLayout";

export interface BlogLayoutProps {
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  canonical: string;
  children: ReactNode;
}

const CATEGORY_COLORS: Record<string, string> = {
  Guide: "var(--accent)",
  Tutorial: "#42a5f5",
  News: "#ab47bc",
  Engineering: "#ffab40",
  "Case Study": "#26c6da",
};

const BLOG_NAV_LINKS = [
  { label: "Blog", to: "/blog" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
];

const BLOG_FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Blog", to: "/blog" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Privacy", to: "/privacy" },
  { label: "Log in", to: "/login" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function BlogLayout({
  title,
  description,
  date,
  readTime,
  category,
  canonical,
  children,
}: BlogLayoutProps) {
  usePageMeta({
    title: `${title} — UptimeCrow Blog`,
    description,
    canonical,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description,
      datePublished: date,
      author: {
        "@type": "Organization",
        name: "UptimeCrow",
        url: "https://uptimecrow.com",
      },
      publisher: {
        "@type": "Organization",
        name: "UptimeCrow",
        url: "https://uptimecrow.com",
      },
      url: canonical,
    },
  });

  const categoryColor = CATEGORY_COLORS[category] ?? "var(--accent)";

  return (
    <MarketingLayout navLinks={BLOG_NAV_LINKS} footerLinks={BLOG_FOOTER_LINKS}>
      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "3rem 1.5rem 5rem",
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            to="/blog"
            style={{
              color: "var(--text3)",
              textDecoration: "none",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--accent)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text3)")}
          >
            &#8592; Back to blog
          </Link>
        </div>

        {/* Header */}
        <header style={{ marginBottom: "2.5rem" }}>
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.2rem 0.65rem",
                borderRadius: 999,
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: categoryColor,
                color: "#000",
              }}
            >
              {category}
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              color: "var(--text)",
              margin: "0 0 1rem",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              color: "var(--text3)",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "var(--text2)", fontWeight: 600 }}>UptimeCrow Team</span>
            <span aria-hidden>·</span>
            <time dateTime={date}>{formatDate(date)}</time>
            <span aria-hidden>·</span>
            <span>{readTime}</span>
          </div>
        </header>

        {/* Divider */}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            marginBottom: "2.5rem",
          }}
        />

        {/* Body */}
        <div
          style={{
            color: "var(--text2)",
            fontSize: "1rem",
            lineHeight: 1.75,
          }}
          className="blog-body"
        >
          {children}
        </div>
      </article>

      {/* Inline styles for blog body typography */}
      <style>{`
        .blog-body h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text);
          margin: 2.5rem 0 0.75rem;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .blog-body h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          margin: 1.75rem 0 0.5rem;
        }
        .blog-body p {
          margin: 0 0 1.25rem;
          color: var(--text2);
        }
        .blog-body ul,
        .blog-body ol {
          margin: 0 0 1.25rem 1.25rem;
          padding: 0;
        }
        .blog-body li {
          margin-bottom: 0.5rem;
          color: var(--text2);
        }
        .blog-body strong {
          color: var(--text);
          font-weight: 600;
        }
        .blog-body code {
          font-family: var(--mono, 'IBM Plex Mono', monospace);
          font-size: 0.875em;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 0.1em 0.4em;
          color: var(--accent);
        }
        .blog-body pre {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem 1.25rem;
          overflow-x: auto;
          margin: 0 0 1.25rem;
        }
        .blog-body pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.875rem;
          color: var(--text);
        }
        .blog-body a {
          color: var(--accent);
          text-decoration: underline;
          text-decoration-color: transparent;
          transition: text-decoration-color 0.15s;
        }
        .blog-body a:hover {
          text-decoration-color: var(--accent);
        }
        .blog-body blockquote {
          border-left: 3px solid var(--accent);
          margin: 1.5rem 0;
          padding: 0.75rem 1.25rem;
          background: var(--surface);
          border-radius: 0 6px 6px 0;
          color: var(--text2);
          font-style: italic;
        }
      `}</style>
    </MarketingLayout>
  );
}
