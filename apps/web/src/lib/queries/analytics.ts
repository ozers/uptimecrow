import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

interface UptimeData {
  monitorId: string;
  monitorName: string;
  uptimePercent: string | null;
  avgResponseMs: number | null;
  p50ResponseMs: number | null;
  p95ResponseMs: number | null;
  p99ResponseMs: number | null;
  totalChecks: number;
}

export function useUptime(hasMonitors: boolean, days = 30) {
  return useQuery({
    queryKey: ["analytics", "uptime", days],
    queryFn: () =>
      api.get<{ uptime: UptimeData[] }>(`/api/analytics/uptime?days=${days}`),
    select: (data) => data.uptime,
    enabled: hasMonitors,
  });
}
