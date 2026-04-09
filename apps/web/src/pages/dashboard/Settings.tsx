import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import type { Plan } from "@uptimecrow/shared";

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  slackWebhookUrl: string | null;
  discordWebhookUrl: string | null;
}

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [slackUrl, setSlackUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ organization: OrgSettings }>("/api/settings").then((data) => {
      setOrg(data.organization);
      setSlackUrl(data.organization.slackWebhookUrl || "");
      setDiscordUrl(data.organization.discordWebhookUrl || "");
    });
  }, []);

  if (!user) return null;

  const plan = user.plan as Plan;
  const limits = PLAN_LIMITS[plan];

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

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{user.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Plan
              <Badge className="capitalize">{plan}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monitors</p>
                <p className="text-lg font-semibold">{limits.monitors}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Pages</p>
                <p className="text-lg font-semibold">
                  {limits.statusPages === Infinity ? "Unlimited" : limits.statusPages}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Min Check Interval</p>
                <p className="text-lg font-semibold">{limits.minInterval}s</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Retention</p>
                <p className="text-lg font-semibold">{limits.retentionDays} days</p>
              </div>
            </div>
            {plan === "free" && (
              <div className="mt-6 rounded-md bg-primary/10 p-4">
                <p className="text-sm font-medium text-primary">
                  Upgrade to Pro for more monitors, faster intervals, and AI-powered incident reports.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="slack">Slack Webhook URL</Label>
              <p className="text-xs text-muted-foreground">
                Receive incident alerts in Slack. Create an{" "}
                <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Incoming Webhook
                </a>{" "}
                in your Slack workspace.
              </p>
              <div className="flex gap-2">
                <Input
                  id="slack"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackUrl}
                  onChange={(e) => setSlackUrl(e.target.value)}
                />
                {org?.slackWebhookUrl && (
                  <Button variant="outline" size="sm" onClick={() => testWebhook("slack")}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="discord">Discord Webhook URL</Label>
              <p className="text-xs text-muted-foreground">
                Receive incident alerts in Discord. Create a webhook in your channel settings.
              </p>
              <div className="flex gap-2">
                <Input
                  id="discord"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                />
                {org?.discordWebhookUrl && (
                  <Button variant="outline" size="sm" onClick={() => testWebhook("discord")}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={saveWebhooks} disabled={saving}>
              {saving ? "Saving..." : "Save Webhooks"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
