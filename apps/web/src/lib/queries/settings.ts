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
  pagerdutyIntegrationKey: string | null;
  teamsWebhookUrl: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioFromNumber: string | null;
  twilioToNumber: string | null;
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
  return Boolean(
    s.slackWebhookUrl ||
      s.discordWebhookUrl ||
      s.customWebhookUrl ||
      s.teamsWebhookUrl ||
      s.pagerdutyIntegrationKey ||
      (s.telegramBotToken && s.telegramChatId) ||
      (s.twilioAccountSid && s.twilioAuthToken && s.twilioFromNumber && s.twilioToNumber),
  );
}
