import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/** Inline crow mark — matches the status page favicon/logo exactly. */
function CrowMark({ size = 30 }: { size?: number }) {
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

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Editorial split-screen auth layout — the "ink band" from the status page as
 * a full-height brand panel on the left, the form on warm paper to the right.
 * Shared by every auth screen so they read as one product.
 */
export function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel (ink) ── */}
      <aside className="relative hidden overflow-hidden bg-foreground px-14 py-16 text-background lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            background:
              "radial-gradient(120% 90% at 15% 0%, hsl(var(--brand) / 0.22) 0%, transparent 55%)",
          }}
        />
        <Link to="/" className="relative z-10 inline-flex items-center gap-2.5">
          <CrowMark size={30} />
          <span className="text-[17px] font-bold tracking-[-0.02em]">UptimeCrow</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/50">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.03] tracking-[-0.035em] text-balance">
            {title}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-background/60">{subtitle}</p>
        </div>

        <div className="relative z-10 flex items-center gap-2 font-mono text-[11px] text-background/45">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
          Open-source status pages · self-host or hosted
        </div>
      </aside>

      {/* ── Form panel (paper) ── */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand (panel hidden) */}
          <Link to="/" className="mb-10 inline-flex items-center gap-2.5 lg:hidden">
            <CrowMark size={28} />
            <span className="text-base font-bold tracking-[-0.02em]">UptimeCrow</span>
          </Link>

          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground lg:hidden">
              {eyebrow}
            </p>
            <h2 className="mt-2 font-display text-[26px] font-bold tracking-[-0.03em] lg:hidden">
              {title}
            </h2>
            <h2 className="hidden font-display text-[26px] font-bold tracking-[-0.03em] lg:block">
              {eyebrow}
            </h2>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
