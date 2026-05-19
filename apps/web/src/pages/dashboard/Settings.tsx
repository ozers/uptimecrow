import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import { toast } from "sonner";
import { User, CreditCard, Webhook, ExternalLink, Loader2, Users, Trash2, Plus, Zap, Sparkles } from "lucide-react";
import { restartOnboarding } from "@/components/setup-checklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ApiKeysSection } from "@/components/api-keys-section";
import { useTeam, useInviteMember, useRemoveMember, useCancelInvite } from "@/lib/queries/team";
import type { Plan } from "@uptimecrow/shared";

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  slackWebhookUrl: string | null;
  discordWebhookUrl: string | null;
  customWebhookUrl: string | null;
  pagerdutyIntegrationKey: string | null;
  teamsWebhookUrl: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioFromNumber: string | null;
  twilioToNumber: string | null;
}

const UPGRADE_PLANS = [
  {
    name: "Indie" as const,
    plan: "indie" as const,
    monthly: 12,
    annual: 10,
    annualTotal: 120,
    features: ["30 monitors", "3 status pages", "API access", "Custom domain", "2 team seats"],
  },
  {
    name: "Pro" as const,
    plan: "pro" as const,
    monthly: 29,
    annual: 24,
    annualTotal: 290,
    features: ["50 monitors", "Multi-region checks", "30s intervals", "10 status pages", "3 team seats"],
    featured: true,
  },
  {
    name: "Team" as const,
    plan: "team" as const,
    monthly: 79,
    annual: 66,
    annualTotal: 790,
    features: ["200 monitors", "100 heartbeats", "10 team seats", "365-day history", "Priority support"],
  },
];

function UpgradeOptions() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: "indie" | "pro" | "team") => {
    setLoading(plan);
    try {
      const data = await api.post<{ checkoutUrl: string }>("/api/billing/checkout", {
        plan,
        interval: annual ? "yearly" : "monthly",
      });
      window.location.href = data.checkoutUrl;
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to start checkout");
      setLoading(null);
    }
  };

  return (
    <div className="border-t border-border/50 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Upgrade your plan</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${annual ? "text-muted-foreground" : "text-foreground font-medium"}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual((v) => !v)}
            aria-label="Toggle annual billing"
            className="relative h-5 w-9 rounded-full border-none cursor-pointer transition-colors"
            style={{ background: annual ? "hsl(var(--primary))" : "hsl(var(--border))" }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
              style={{ left: annual ? "calc(100% - 18px)" : "2px" }}
            />
          </button>
          <span className={`text-xs ${annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Annual
            {annual && <span className="ml-1 text-primary font-semibold">2 mo free</span>}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {UPGRADE_PLANS.map((p) => (
          <div
            key={p.plan}
            className={`rounded-lg border p-3 space-y-2 ${p.featured ? "border-primary/50 bg-primary/5" : "border-border"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{p.name}</span>
              {p.featured && <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Popular</span>}
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-bold">${annual ? p.annual : p.monthly}</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            {annual && (
              <p className="text-[11px] text-muted-foreground -mt-1">billed ${p.annualTotal}/yr</p>
            )}
            <ul className="space-y-0.5">
              {p.features.map((f) => (
                <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              className={`w-full gap-1.5 ${p.featured ? "" : "variant-outline"}`}
              variant={p.featured ? "default" : "outline"}
              onClick={() => handleCheckout(p.plan)}
              disabled={loading !== null}
            >
              {loading === p.plan ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Upgrade to {p.name}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  );
}

const SETTINGS_SECTIONS = [
  { id: "settings-account", label: "Account", icon: User },
  { id: "settings-plan", label: "Plan", icon: CreditCard },
  { id: "settings-integrations", label: "Integrations", icon: Webhook },
  { id: "settings-api-keys", label: "API Keys", icon: Zap },
  { id: "settings-team", label: "Team", icon: Users },
] as const;

function SettingsNav() {
  const [active, setActive] = useState("settings-account");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    SETTINGS_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="hidden lg:block w-44 shrink-0">
      <div className="sticky top-20 space-y-1">
        {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              setActive(id);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              active === id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </a>
        ))}
      </div>
    </aside>
  );
}

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [slackUrl, setSlackUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [customWebhookUrl, setCustomWebhookUrl] = useState("");
  const [pagerdutyKey, setPagerdutyKey] = useState("");
  const [teamsUrl, setTeamsUrl] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [twilioTo, setTwilioTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    api.get<{ organization: OrgSettings }>("/api/settings").then((data) => {
      setOrg(data.organization);
      setSlackUrl(data.organization.slackWebhookUrl || "");
      setDiscordUrl(data.organization.discordWebhookUrl || "");
      setCustomWebhookUrl(data.organization.customWebhookUrl || "");
      setPagerdutyKey(data.organization.pagerdutyIntegrationKey || "");
      setTeamsUrl(data.organization.teamsWebhookUrl || "");
      setTelegramToken(data.organization.telegramBotToken ? "••••" : "");
      setTelegramChatId(data.organization.telegramChatId || "");
      setTwilioSid(data.organization.twilioAccountSid || "");
      setTwilioToken(data.organization.twilioAuthToken ? "••••" : "");
      setTwilioFrom(data.organization.twilioFromNumber || "");
      setTwilioTo(data.organization.twilioToNumber || "");
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
        customWebhookUrl: customWebhookUrl || null,
        pagerdutyIntegrationKey: pagerdutyKey || null,
        teamsWebhookUrl: teamsUrl || null,
        ...(telegramToken && !telegramToken.startsWith("••") ? { telegramBotToken: telegramToken } : {}),
        telegramChatId: telegramChatId || null,
        twilioAccountSid: twilioSid || null,
        ...(twilioToken && !twilioToken.startsWith("••") ? { twilioAuthToken: twilioToken } : {}),
        twilioFromNumber: twilioFrom || null,
        twilioToNumber: twilioTo || null,
      });
      setOrg(data.organization);
      analytics.integrationSaved("webhook");
      toast.success("Webhooks saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (type: "slack" | "discord" | "custom" | "pagerduty" | "teams" | "telegram" | "sms") => {
    try {
      await api.post("/api/settings/test-webhook", { type });
      analytics.integrationTested(type);
      toast.success(`Test ${type} notification sent!`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : `Failed to test ${type}`);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Account, plan, and integrations" />

      <div className="flex gap-10 items-start">
        <SettingsNav />
        <div className="min-w-0 flex-1 max-w-2xl space-y-10">

        {/* Account */}
        <div id="settings-account">
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
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs text-muted-foreground w-28">Setup guide</span>
              <button
                onClick={() => {
                  restartOnboarding();
                  toast.success("Setup guide reopened");
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Show setup guide
              </button>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div id="settings-plan">
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
                { label: "Heartbeats", value: limits.heartbeats },
                { label: "Min Check Interval", value: `${limits.minInterval}s` },
                { label: "Data Retention", value: `${limits.retentionDays} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            {plan === "free" && (
              <UpgradeOptions />
            )}
          </div>
        </div>

        {/* Integrations */}
        <div id="settings-integrations">
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
            <div className="py-4 border-b border-border">
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

            {/* Custom Webhook */}
            <div className="py-4 border-b border-border">
              <div className="mb-3">
                <Label htmlFor="customWebhook" className="text-sm font-medium">Custom Webhook URL</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  POST JSON payload to any URL on incident events.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="customWebhook"
                  placeholder="https://example.com/webhooks/uptimecrow"
                  value={customWebhookUrl}
                  onChange={(e) => setCustomWebhookUrl(e.target.value)}
                  className="flex-1"
                />
                {org?.customWebhookUrl && (
                  <Button variant="outline" size="sm" className="sm:shrink-0" onClick={() => testWebhook("custom")}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            {/* PagerDuty */}
            <div className="py-4 border-b border-border">
              <div className="mb-3">
                <Label htmlFor="pagerduty" className="text-sm font-medium">PagerDuty Integration Key</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Events API v2 integration key. Create a new service in PagerDuty → Integrations → Events API v2.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="pagerduty"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={pagerdutyKey}
                  onChange={(e) => setPagerdutyKey(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
                {org?.pagerdutyIntegrationKey && (
                  <Button variant="outline" size="sm" className="sm:shrink-0" onClick={() => testWebhook("pagerduty")}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            {/* Microsoft Teams */}
            <div className="py-4 border-b border-border">
              <div className="mb-3">
                <Label htmlFor="teams" className="text-sm font-medium">Microsoft Teams Webhook URL</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Incoming webhook URL from Teams channel settings → Connectors → Incoming Webhook.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="teams"
                  placeholder="https://outlook.office.com/webhook/..."
                  value={teamsUrl}
                  onChange={(e) => setTeamsUrl(e.target.value)}
                  className="flex-1"
                />
                {org?.teamsWebhookUrl && (
                  <Button variant="outline" size="sm" className="sm:shrink-0" onClick={() => testWebhook("teams")}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            {/* Telegram */}
            <div className="py-4 border-b border-border">
              <div className="mb-3">
                <Label className="text-sm font-medium">Telegram Bot</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Create a bot via{" "}
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a>
                  , add it to your channel/group, and paste the token + chat ID below.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Bot token (from BotFather)"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="font-mono text-sm"
                  type="password"
                />
                <Input
                  placeholder="Chat ID (e.g. -1001234567890)"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              {org?.telegramBotToken && org?.telegramChatId && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => testWebhook("telegram")}>
                  Test Telegram
                </Button>
              )}
            </div>

            {/* Twilio SMS */}
            <div className="py-4">
              <div className="mb-3">
                <Label className="text-sm font-medium">SMS Alerts via Twilio</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Receive incident alerts via SMS. Get your credentials from the{" "}
                  <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twilio Console</a>.
                  Use a Twilio phone number for "From" and your mobile number for "To".
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Account SID (ACxxxxxxx...)"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Auth Token"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  className="font-mono text-sm"
                  type="password"
                />
                <Input
                  placeholder="From number (+15551234567)"
                  value={twilioFrom}
                  onChange={(e) => setTwilioFrom(e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="To number (+15559876543)"
                  value={twilioTo}
                  onChange={(e) => setTwilioTo(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              {org?.twilioAccountSid && org?.twilioAuthToken && org?.twilioFromNumber && org?.twilioToNumber && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => testWebhook("sms")}>
                  Test SMS
                </Button>
              )}
            </div>
          </div>
          <div className="pt-4">
            <Button onClick={saveWebhooks} disabled={saving}>
              {saving ? "Saving…" : "Save Webhooks"}
            </Button>
          </div>
        </div>

        <div id="settings-api-keys"><ApiKeysSection enabled={limits.apiAccess} /></div>

        <div id="settings-team"><TeamSection orgPlan={plan} /></div>

        </div>
      </div>
    </div>
  );
}

function TeamSection({ orgPlan }: { orgPlan: string }) {
  const { data, isLoading } = useTeam();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const cancelInvite = useCancelInvite();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const pendingInvites = data?.invites?.filter((i) => !i.acceptedAt) ?? [];

  return (
    <div>
      <SectionLabel icon={Users} title="Team" />
      <div className="border-t border-b border-border">
        {/* Members */}
        {isLoading ? (
          <div className="py-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {(data?.members ?? []).map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email} · <span className="capitalize">{member.role}</span></p>
                </div>
                <button
                  onClick={() => removeMember.mutate(member.userId, { onSuccess: () => toast.success("Member removed"), onError: () => toast.error("Failed") })}
                  className="text-destructive/60 hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0 opacity-60">
                <div>
                  <p className="text-sm">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">Invite pending · <span className="capitalize">{invite.role}</span></p>
                </div>
                <button
                  onClick={() => cancelInvite.mutate(invite.id, { onSuccess: () => toast.success("Invite cancelled") })}
                  className="text-destructive/60 hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {data?.members.length === 0 && pendingInvites.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">No team members yet.</p>
            )}
          </>
        )}
      </div>

      <div className="pt-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Invite a teammate by email. They'll receive a link to join your organization.
          {" "}Your plan allows <strong>{PLAN_LIMITS[orgPlan as Plan]?.teamSeats ?? 1}</strong> seat(s).
        </p>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 min-w-48"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {inviting ? "Sending…" : "Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
}
