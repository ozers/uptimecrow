import { Link } from "react-router-dom";
import "./Landing.css";
import { usePageMeta } from "@/lib/meta";
import { MarketingLayout } from "@/components/layout/MarketingLayout";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  readTime: string;
}

const POSTS: BlogPost[] = [
  {
    slug: "open-source-uptime-monitoring-guide",
    title: "The Complete Guide to Open-Source Uptime Monitoring (2026)",
    date: "2026-05-19",
    category: "Guide",
    readTime: "12 min read",
    excerpt:
      "From choosing between self-hosted and cloud to setting up alerts and status pages — everything you need to know.",
  },
];

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

export default function BlogIndex() {
  usePageMeta({
    title: "Blog — UptimeCrow",
    description:
      "Practical guides on uptime monitoring, reliability, and SRE. Learn how to monitor your services, reduce false positives, and build reliable systems.",
    canonical: "https://uptimecrow.com/blog",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "UptimeCrow Blog",
      description:
        "Practical guides on uptime monitoring, reliability, and SRE.",
      url: "https://uptimecrow.com/blog",
      publisher: {
        "@type": "Organization",
        name: "UptimeCrow",
        url: "https://uptimecrow.com",
      },
    },
  });

  return (
    <MarketingLayout navLinks={BLOG_NAV_LINKS} footerLinks={BLOG_FOOTER_LINKS}>
      {/* Hero */}
      <section className="hero" style={{ paddingBottom: "2.5rem" }}>
        <div className="container">
          <div className="hero-badge">&#9679; Uptime knowledge base</div>
          <h1>The UptimeCrow Blog</h1>
          <p className="hero-sub">
            Practical guides on uptime monitoring, reliability, and SRE.
          </p>
        </div>
      </section>

      {/* Post list */}
      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {POSTS.map((post) => {
              const categoryColor = CATEGORY_COLORS[post.category] ?? "var(--accent)";
              return (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <article
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "1.5rem",
                      transition: "border-color 0.15s, transform 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--accent)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--border)";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Top meta row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.15rem 0.55rem",
                          borderRadius: 999,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          background: categoryColor,
                          color: "#000",
                        }}
                      >
                        {post.category}
                      </span>
                      <time
                        dateTime={post.date}
                        style={{ color: "var(--text3)", fontSize: "0.85rem" }}
                      >
                        {formatDate(post.date)}
                      </time>
                      <span style={{ color: "var(--text3)", fontSize: "0.85rem" }}>
                        {post.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "var(--text)",
                        margin: "0 0 0.6rem",
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p
                      style={{
                        margin: 0,
                        color: "var(--text2)",
                        lineHeight: 1.65,
                        fontSize: "0.95rem",
                      }}
                    >
                      {post.excerpt}
                    </p>

                    {/* Read more */}
                    <div
                      style={{
                        marginTop: "1rem",
                        fontSize: "0.875rem",
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      Read article &#8594;
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Start monitoring for free.</h2>
          <p>25 monitors, 5 heartbeats, and a public status page — no credit card required.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">
              Get Started Free
            </Link>
            <a
              href="https://github.com/ozers/uptimecrow"
              target="_blank"
              rel="noreferrer"
              className="hero-btn secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
