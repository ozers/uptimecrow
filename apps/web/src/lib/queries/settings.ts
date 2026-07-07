import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  slackWebhookUrl: string | null;
  discordWebhookUrl: string | null;
  customWebhookUrl: string | null;
}

export function useOrgSettings() {
  return useQuery({
    queryKey: ["org-settings"],
    queryFn: () =>
      api
        .get<{ organization: OrgSettings }>("/api/settings")
        .then((d) => d.organization),
    staleTime: 60_000,
  });
}

export function hasNotificationChannel(s: OrgSettings | undefined): boolean {
  if (!s) return false;
  return Boolean(s.slackWebhookUrl || s.discordWebhookUrl || s.customWebhookUrl);
}
