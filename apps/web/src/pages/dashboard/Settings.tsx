import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import { toast } from "sonner";
import { User, CreditCard, Webhook, ExternalLink, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ApiKeysSection } from "@/components/api-keys-section";
import type { Plan } from "@uptimecrow/shared";

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  slackWebhookUrl: string | null;
  discordWebhookUrl: string | null;
}

function SectionLabel({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  );
}

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [slackUrl, setSlackUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    api.get<{ organization: OrgSettings }>("/api/settings").then((data) => {
      setOrg(data.organization);
      setSlackUrl(data.organization.slackWebhookUrl || "");
      setDiscordUrl(data.organization.discordWebhookUrl || "");
    });
  }, []);

  // Handle return from billing checkout
  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      toast.success("Plan upgraded successfully! Your new limits are now active.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (!user) return null;

  const plan = user.plan as Plan;
  const limits = PLAN_LIMITS[plan];

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const data = await api.post<{ portalUrl: string }>("/api/billing/portal", {});
      window.open(data.portalUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const saveWebhooks = async () => {
    setSaving(true);
    try {
      const data = await api.patch<{ organization: OrgSettings }>("/api/settings", {
        slackWebhookUrl: slackUrl || null,
        discordWebhookUrl: discordUrl || null,
      });
      setOrg(data.organization);
      toast.success("Webhooks saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (type: "slack" | "discord") => {
    try {
      await api.post("/api/settings/test-webhook", { type });
      toast.success(`Test ${type} notification sent!`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : `Failed to test ${type}`);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Account, plan, and integrations" />

      <div className="max-w-2xl space-y-10">

        {/* Account */}
        <div>
          <SectionLabel icon={User} title="Account" />
          <div className="divide-y divide-border border-t border-b border-border">
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs text-muted-foreground w-28">Name</span>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs text-muted-foreground w-28">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs text-muted-foreground w-28">Organization</span>
              <span className="text-sm font-medium">{org?.name ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div>
          <SectionLabel icon={CreditCard} title="Plan" />
          <div className="border-t border-b border-border">
            {/* Plan header */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">{plan}</span>
                <Badge variant={plan === "free" ? "secondary" : "default"} className="text-xs capitalize">
                  {plan}
                </Badge>
              </div>
              {plan !== "free" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="gap-1.5"
                >
                  {portalLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  Manage Subscription
                </Button>
              )}
            </div>

            {/* Limits */}
            <div className="divide-y divide-border border-t border-border/50">
              {[
                { label: "Monitors", value: limits.monitors },
                { label: "Status Pages", value: limits.statusPages === Infinity ? "Unlimited" : limits.statusPages },
                { label: "Min Check Interval", value: `${limits.minInterval}s` },
                { label: "Data Retention", value: `${limits.retentionDays} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            {/* Upgrade options for free plan — self-serve checkout is paused for
                billing-infra migration; we direct users to email support. */}
            {plan === "free" && (
              <div className="border-t border-border/50 py-4">
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400">
                    <Mail className="h-4 w-4" />
                    Upgrades and coupons temporarily via email
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                    Online payments and coupon redemption are paused while we migrate our billing
                    infrastructure. Send us the plan you want from your account email and we'll activate
                    it manually — usually the same day.
                  </p>
                  <Button size="sm" variant="outline" asChild className="gap-1.5">
                    <a href="mailto:support@hooksense.com?subject=UptimeCrow%20upgrade%20request">
                      <Mail className="h-3.5 w-3.5" />
                      Email support@hooksense.com
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integrations */}
        <div>
          <SectionLabel icon={Webhook} title="Integrations" />
          <div className="border-t border-border">
            {/* Slack */}
            <div className="py-4 border-b border-border">
              <div className="mb-3">
                <Label htmlFor="slack" className="text-sm font-medium">Slack Webhook URL</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Receive incident alerts in Slack.{" "}
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Create an Incoming Webhook
                  </a>{" "}
                  in your Slack workspace.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="slack"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackUrl}
                  onChange={(e) => setSlackUrl(e.target.value)}
                  className="flex-1"
                />
                {org?.slackWebhookUrl && (
                  <Button variant="outline" size="sm" className="sm:shrink-0" onClick={() => testWebhook("slack")}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            {/* Discord */}
            <div className="py-4">
              <div className="mb-3">
                <Label htmlFor="discord" className="text-sm font-medium">Discord Webhook URL</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Receive incident alerts in Discord. Create a webhook in your channel settings.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="discord"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  className="flex-1"
                />
                {org?.discordWebhookUrl && (
                  <Button variant="outline" size="sm" className="sm:shrink-0" onClick={() => testWebhook("discord")}>
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="pt-4">
            <Button onClick={saveWebhooks} disabled={saving}>
              {saving ? "Saving…" : "Save Webhooks"}
            </Button>
          </div>
        </div>

        <ApiKeysSection enabled={limits.apiAccess} />

      </div>
    </div>
  );
}
