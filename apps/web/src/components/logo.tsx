import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  to?: string;
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "h-7 w-7 rounded-[8px]", text: "text-base", gap: "gap-2" },
  md: { icon: "h-9 w-9 rounded-[10px]", text: "text-lg", gap: "gap-2.5" },
  lg: { icon: "h-12 w-12 rounded-xl", text: "text-xl", gap: "gap-3" },
};

export function Logo({ size = "md", to = "/", showText = true, className }: LogoProps) {
  const s = sizes[size];

  const content = (
    <div className={cn("flex items-center", s.gap, className)}>
      <img src="/logo.png" alt="UptimeCrow" className={s.icon} />
      {showText && (
        <span className={cn("font-bold tracking-tight text-primary", s.text)}>
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
      <img src="/logo.png" alt="UptimeCrow" className="h-14 w-14 rounded-xl" />
      <span className="text-xl font-bold tracking-tight text-primary">UptimeCrow</span>
    </Link>
  );
}
