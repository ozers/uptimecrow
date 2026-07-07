import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Inline crow mark — matches the status page favicon / auth shell exactly. */
export function CrowMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 270 270"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="270" height="270" rx="61" fill="#767E8F" />
      <path
        d="M208 83L237 55L155 105L135 85L115 105L33 55L62 83L0 225C0 241 22 270 62 270H208C248 270 270 241 270 225L208 83Z"
        fill="#353A46"
      />
      <path
        d="M188.5 103L167 116c3 8 12.5 11.6 17 10.5 5-1.25 10-5 10-12.5 0-6-3.3-9.8-5.5-11Z"
        fill="#59F94F"
      />
      <path
        d="M81.5 103L103 116c-3 8-12.5 11.6-17 10.5-5-1.25-10-5-10-12.5 0-6 3.3-9.8 5.5-11Z"
        fill="#59F94F"
      />
      <path d="M135 190V105l-35 40 20 15 15 30Z" fill="#E29B4C" />
      <path d="M135 190V105l35 40-20 15-15 30Z" fill="#F3BC6F" />
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  to?: string;
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 26, text: "text-[15px]", gap: "gap-2" },
  md: { icon: 30, text: "text-[17px]", gap: "gap-2.5" },
  lg: { icon: 44, text: "text-xl", gap: "gap-3" },
};

export function Logo({ size = "md", to = "/", showText = true, className }: LogoProps) {
  const s = sizes[size];

  const content = (
    <div className={cn("flex items-center", s.gap, className)}>
      <CrowMark size={s.icon} />
      {showText && (
        <span className={cn("font-bold tracking-[-0.02em] text-foreground", s.text)}>
          UptimeCrow
        </span>
      )}
    </div>
  );

  return (
    <Link to={to} className="inline-flex">
      {content}
    </Link>
  );
}

export function LogoStacked({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn("flex flex-col items-center gap-3", className)}>
      <CrowMark size={56} />
      <span className="text-xl font-bold tracking-[-0.02em] text-foreground">UptimeCrow</span>
    </Link>
  );
}
