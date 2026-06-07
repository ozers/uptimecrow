import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MarketingNav } from "@/components/marketing-nav";
import "../Landing.css";

const BRAND = "UptimeCrow";

interface ToolsLayoutProps {
  children: ReactNode;
}

export function ToolsLayout({ children }: ToolsLayoutProps) {

  return (
    <div className="landing">
      <MarketingNav />

      {children}

      <footer>
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/docs">Docs</Link>
              <Link to="/tools">Free Tools</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
