import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/lib/meta";
import { MarketingNav } from "@/components/marketing-nav";
import "./landing-redesign.css";

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
    <div className="lp">
      <MarketingNav />
      <div className="lp-auth">
        <div className="lp-auth-card">
          <img className="lp-auth-mascot" src="/crow-mascot.png" alt="" aria-hidden="true" />
          <h1>Reset password</h1>
          <p className="lp-auth-sub">
            {sent
              ? "Check your email for a reset link."
              : "Enter your email and we'll send you a reset link."}
          </p>

          {!sent ? (
            <form className="lp-auth-form" onSubmit={handleSubmit}>
              <div className="lp-auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="lp-auth-submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : (
            <p className="lp-auth-sub" style={{ marginTop: "22px" }}>
              If that email is registered, you&apos;ll receive a link shortly.
            </p>
          )}

          <p className="lp-auth-alt">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
