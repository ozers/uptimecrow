import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { usePageMeta } from "@/lib/meta";
import { useInviteInfo } from "@/lib/queries/team";
import { Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      const res = await api.post<{ token: string }>("/api/auth/accept-invite", { token });
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <XCircle className="h-12 w-12 text-danger-foreground mx-auto" />
          <h1 className="text-xl font-semibold">Invite not found</h1>
          <p className="text-muted-foreground text-sm">
            This invite link is invalid, expired, or already accepted.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-success-foreground mx-auto" />
          <h1 className="text-xl font-semibold">Invite accepted!</h1>
          <p className="text-muted-foreground text-sm">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">You're invited to join</h1>
            <p className="text-sm font-medium text-primary">{invite.orgName}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invited email</span>
            <span className="font-medium">{invite.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{invite.role}</span>
          </div>
        </div>

        {acceptError && (
          <p className="text-sm text-danger-foreground">{acceptError}</p>
        )}

        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Logged in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <Button onClick={handleAccept} disabled={accepting} className="w-full">
              {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Accept & join {invite.orgName}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              This will switch your active workspace to {invite.orgName}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create an account or log in to accept this invite.
            </p>
            <Button asChild className="w-full">
              <Link to={`/register?invite=${token}`}>Create account & accept</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/login?invite=${token}`}>Log in & accept</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
