import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "../../pages/Landing.css";

const BRAND = "UptimeCrow";

export interface NavLink {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
  className?: string;
}

export interface FooterLink {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: "Features", to: "/#features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
];

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { label: "Home", to: "/" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "vs BetterStack", to: "/vs/betterstack" },
  { label: "Privacy", to: "/privacy" },
  { label: "Log in", to: "/login" },
];

interface MarketingLayoutProps {
  children: React.ReactNode;
  className?: string;
  navLinks?: NavLink[];
  footerLinks?: FooterLink[];
}

function renderNavLink(link: NavLink, onClick?: () => void) {
  const props = { className: link.className, onClick };
  if (link.href) {
    return (
      <a
        key={link.label}
        href={link.href}
        target={link.external ? "_blank" : undefined}
        rel={link.external ? "noopener noreferrer" : undefined}
        {...props}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link key={link.label} to={link.to!} {...props}>
      {link.label}
    </Link>
  );
}

function renderFooterLink(link: FooterLink) {
  if (link.href) {
    return (
      <a
        key={link.label}
        href={link.href}
        target={link.external ? "_blank" : undefined}
        rel={link.external ? "noopener noreferrer" : undefined}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link key={link.label} to={link.to!}>
      {link.label}
    </Link>
  );
}

export function MarketingLayout({
  children,
  className,
  navLinks = DEFAULT_NAV_LINKS,
  footerLinks = DEFAULT_FOOTER_LINKS,
}: MarketingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`landing${className ? ` ${className}` : ""}`}>
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <img src="/logo.png" alt="UptimeCrow logo" className="logo-img" />
              <span>{BRAND}</span>
            </Link>
          </div>
          <div className="nav-links">
            {navLinks.map((link) => renderNavLink(link))}
            <Link to="/login" className="nav-login">
              Log in
            </Link>
            <Link to="/register" className="nav-cta">
              Get Started Free
            </Link>
          </div>
          <button
            className="nav-hamburger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="nav-mobile" role="dialog" aria-label="Mobile navigation">
            {navLinks.map((link) =>
              renderNavLink(link, () => setMobileOpen(false))
            )}
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              Log in
            </Link>
            <Link
              to="/register"
              className="nav-cta mobile-cta"
              onClick={() => setMobileOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {children}

      <footer>
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              {footerLinks.map((link) => renderFooterLink(link))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
