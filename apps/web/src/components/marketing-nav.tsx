import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./marketing-nav.css";

/**
 * Shared marketing header — identical, sticky on every public page (landing,
 * pricing, docs, compare, tools, auth …). Self-contained styling (warm literals,
 * its own classes) so it looks the same regardless of the parent page wrapper.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="uc-header" role="banner">
      <div className="uc-header-inner">
        <Link to="/" className="uc-brand" onClick={toTop}>
          <img src="/logo.svg" alt="UptimeCrow logo" />
          <span>UptimeCrow</span>
        </Link>

        <div className="uc-links" role="navigation" aria-label="Primary">
          <Link to="/#how">How it works</Link>
          <Link to="/#features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/login" className="uc-login">Log in</Link>
          <Link to="/register" className="uc-cta">Get started free</Link>
        </div>

        <button
          className="uc-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="uc-mobile" role="dialog" aria-label="Mobile navigation">
          <Link to="/#how" onClick={close}>How it works</Link>
          <Link to="/#features" onClick={close}>Features</Link>
          <Link to="/pricing" onClick={close}>Pricing</Link>
          <Link to="/docs" onClick={close}>Docs</Link>
          <Link to="/login" onClick={close}>Log in</Link>
          <Link to="/register" className="uc-cta" onClick={close}>Get started free</Link>
        </div>
      )}
    </div>
  );
}
