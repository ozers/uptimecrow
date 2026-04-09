import { useAuthStore } from "@/lib/auth";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import type { Plan } from "@uptimecrow/shared";

export function Settings() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const plan = user.plan as Plan;
  const limits = PLAN_LIMITS[plan];

  return (
    <div>
      <PageHeader title="Settings" description="Account and plan information" />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{user.name}</p>
              </div>
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
              <div>
                <p className="text-sm text-muted-foreground">Team Seats</p>
                <p className="text-lg font-semibold">{limits.teamSeats}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Incidents</p>
                <p className="text-lg font-semibold">{limits.aiIncidents ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custom Domain</p>
                <p className="text-lg font-semibold">{limits.customDomain ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Access</p>
                <p className="text-lg font-semibold">{limits.apiAccess ? "Yes" : "No"}</p>
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
      </div>
    </div>
  );
}
