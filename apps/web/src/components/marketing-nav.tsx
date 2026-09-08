import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/ozers/uptimecrow";

/** Inline crow mark — matches the auth shell / status page favicon exactly. */
export function CrowMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 270 270" aria-hidden="true" className="shrink-0">
      <rect width="270" height="270" rx="61" fill="#767E8F" />
      <path d="M208 83L237 55L155 105L135 85L115 105L33 55L62 83L0 225C0 241 22 270 62 270H208C248 270 270 241 270 225L208 83Z" fill="#353A46" />
      <path d="M188.5 103L167 116c3 8 12.5 11.6 17 10.5 5-1.25 10-5 10-12.5 0-6-3.3-9.8-5.5-11Z" fill="#59F94F" />
      <path d="M81.5 103L103 116c-3 8-12.5 11.6-17 10.5-5-1.25-10-5-10-12.5 0-6 3.3-9.8 5.5-11Z" fill="#59F94F" />
      <path d="M135 190V105l-35 40 20 15 15 30Z" fill="#E29B4C" />
      <path d="M135 190V105l35 40-20 15-15 30Z" fill="#F3BC6F" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/#how", label: "How it works" },
  { to: "/#features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/docs", label: "Docs" },
];

/**
 * Shared marketing header — sticky, clean paper bar with a hairline border.
 * Crow mark + mono nav links + ink "Get started" button. Identical on every
 * public page so the marketing site reads as one product with the auth screens.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
        <Link
          to="/"
          onClick={toTop}
          className="inline-flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-foreground"
        >
          <CrowMark size={28} />
          <span>UptimeCrow</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex" role="navigation" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-mono text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="font-mono text-[12.5px] font-medium text-foreground transition-colors hover:text-brand"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="h-9 rounded-full px-4">
            <Link to="/register">Get started</Link>
          </Button>
        </div>

        <button
          className="inline-flex items-center justify-center p-1 text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div
          className="flex flex-col border-t border-border bg-background px-6 pb-5 pt-2 md:hidden"
          role="dialog"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={close}
              className="border-b border-border py-3 font-mono text-sm text-muted-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={close}
            className="border-b border-border py-3 font-mono text-sm text-foreground"
          >
            Log in
          </Link>
          <Button asChild className="mt-4 w-full">
            <Link to="/register" onClick={close}>
              Get started
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

const FOOTER_COLS = [
  {
    label: "Product",
    links: [
      { to: "/#features", label: "Features" },
      { to: "/pricing", label: "Pricing" },
      { to: "/docs", label: "API Docs" },
      { to: "/self-host", label: "Self-host" },
      { to: "/changelog", label: "Changelog" },
    ],
  },
  {
    label: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
    ],
  },
];

/**
 * Shared marketing footer — editorial, paper base with a hairline top border,
 * crow mark, mono column labels. Reused on every public page for consistency.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em]">
              <CrowMark size={26} />
              <span>UptimeCrow</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Open-source status pages that stay up when you&apos;re down. Self-host under AGPL-3.0
              or use the hosted free tier.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {FOOTER_COLS.map((col) => (
              <div key={col.label}>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {col.label}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-brand"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-muted-foreground">
            &copy; 2026 UptimeCrow · Built with care in Istanbul
          </p>
          <div className="flex items-center gap-5 font-mono text-[11px]">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <Link to="/login" className="text-muted-foreground transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link to="/register" className="text-muted-foreground transition-colors hover:text-foreground">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
