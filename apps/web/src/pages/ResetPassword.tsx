import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/lib/meta";
import { MarketingNav } from "@/components/marketing-nav";
import "./landing-redesign.css";

export function ResetPassword() {
  usePageMeta({
    title: "Set a new password — UptimeCrow",
    description: "Choose a new password for your UptimeCrow account.",
    robots: "noindex,nofollow",
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      toast.success("Password updated!");
      navigate("/login");
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
          {!token ? (
            <>
              <h1>Invalid reset link</h1>
              <p className="lp-auth-sub">This link is invalid or has expired.</p>
              <p className="lp-auth-alt">
                <Link to="/forgot-password">Request a new one</Link>
              </p>
            </>
          ) : (
            <>
              <h1>Set new password</h1>
              <p className="lp-auth-sub">Enter your new password below.</p>

              <form className="lp-auth-form" onSubmit={handleSubmit}>
                <div className="lp-auth-field">
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="lp-auth-field">
                  <label htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="lp-auth-submit" disabled={loading}>
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>

              <p className="lp-auth-alt">
                <Link to="/login">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
