import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { usePageMeta } from "@/lib/meta";
import { useInviteInfo } from "@/lib/queries/team";
import { Loader2 } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import "./landing-redesign.css";

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp">
      <MarketingNav />
      <div className="lp-auth">
        <div className="lp-auth-card">
          <img className="lp-auth-mascot" src="/crow-mascot.png" alt="" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  );
}

export function AcceptInvite() {
  usePageMeta({
    title: "Accept team invite — UptimeCrow",
    description: "Join a team on UptimeCrow.",
    robots: "noindex,nofollow",
  });
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data, isLoading, error } = useInviteInfo(token);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const invite = data?.invite;

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      await api.post<{ token: string }>("/api/auth/accept-invite", { token });
      // Re-fetch me to update user state
      const me = await api.get<{ user: typeof user }>("/api/auth/me");
      setUser(me.user);
      setAccepted(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e) {
      setAcceptError(e instanceof ApiError ? e.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <InviteShell>
        <p className="lp-auth-sub" style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </p>
      </InviteShell>
    );
  }

  if (error || !invite) {
    return (
      <InviteShell>
        <h1>Invite not found</h1>
        <p className="lp-auth-sub">This invite link is invalid, expired, or already accepted.</p>
        <p className="lp-auth-alt">
          <Link to="/">Go home</Link>
        </p>
      </InviteShell>
    );
  }

  if (accepted) {
    return (
      <InviteShell>
        <h1>Welcome aboard! 🎉</h1>
        <p className="lp-auth-sub">Invite accepted — taking you to the dashboard…</p>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <h1>Join {invite.orgName}</h1>
      <p className="lp-auth-sub">You&apos;ve been invited to a team on UptimeCrow.</p>

      <div className="lp-auth-info">
        <div>
          <span>Invited email</span>
          <strong>{invite.email}</strong>
        </div>
        <div>
          <span>Role</span>
          <strong style={{ textTransform: "capitalize" }}>{invite.role}</strong>
        </div>
      </div>

      {acceptError && <p className="lp-auth-err" style={{ marginTop: "12px" }}>{acceptError}</p>}

      {user ? (
        <div className="lp-auth-form" style={{ marginTop: "18px" }}>
          <button onClick={handleAccept} disabled={accepting} className="lp-auth-submit">
            {accepting ? "Joining…" : `Accept & join ${invite.orgName}`}
          </button>
          <p className="lp-auth-sub" style={{ fontSize: "12.5px", textAlign: "center" }}>
            Logged in as <strong>{user.email}</strong> — this switches your active workspace.
          </p>
        </div>
      ) : (
        <div className="lp-auth-form" style={{ marginTop: "18px" }}>
          <Link to={`/register?invite=${token}`} className="lp-auth-submit" style={{ textAlign: "center", textDecoration: "none" }}>
            Create account &amp; accept
          </Link>
          <Link to={`/login?invite=${token}`} className="lp-auth-ghost">
            Log in &amp; accept
          </Link>
        </div>
      )}
    </InviteShell>
  );
}
