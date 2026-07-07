import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown when a page's data query fails — so a fetch error reads as an error
// (with a retry), not as an empty "you have nothing yet" state.
export function LoadError({
  onRetry,
  message = "Couldn't load this page",
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center border-y border-border py-16 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Something went wrong fetching your data. Check your connection and try again.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
