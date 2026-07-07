import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/lib/meta";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPassword() {
  usePageMeta({
    title: "Reset your password — UptimeCrow",
    description: "Request a password reset link for your UptimeCrow account.",
    robots: "noindex,nofollow",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Reset password"
      title={sent ? "Check your inbox." : "Lost the key?"}
      subtitle={
        sent
          ? "If that email is registered, a reset link is on its way."
          : "Enter your email and we'll send you a reset link."
      }
    >
      {!sent ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 font-mono text-[13px] text-success-foreground">
          Reset link sent. Check your email.
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-brand hover:underline">
          &larr; Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
