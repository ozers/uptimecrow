import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/meta";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";

// React Router had no catch-all, so an unknown URL rendered nothing at all —
// a blank page served with a 200. The server now answers 404 for these paths
// (apps/api/src/web.ts); this is what the visitor reads while it does.
export function NotFound() {
  usePageMeta({
    title: "Page not found — UptimeCrow",
    description: "That page does not exist. Head back to the status pages, the docs, or the pricing page.",
    robots: "noindex,follow",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-24 sm:px-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          404
        </p>
        <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-[42px]">
          This page is down. Permanently.
        </h1>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
          The URL you followed does not exist. If you got here from a link on this
          site, that is our bug — tell us and we will fix it.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/">Back to the home page</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/docs">Read the docs</Link>
          </Button>
        </div>
        <p className="mt-8 font-mono text-[12px] text-muted-foreground">
          Looking for a status page? It lives at{" "}
          <span className="text-foreground">/status/&lt;slug&gt;</span>.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
