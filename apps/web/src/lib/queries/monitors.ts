import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Monitor, CheckResult } from "@uptimecrow/shared";
import { api } from "../api";

export function useMonitors() {
  return useQuery({
    queryKey: ["monitors"],
    queryFn: () => api.get<{ monitors: Monitor[] }>("/api/monitors"),
    select: (data) => data.monitors,
  });
}

export function useMonitor(id: string) {
  return useQuery({
    queryKey: ["monitors", id],
    queryFn: () => api.get<{ monitor: Monitor }>(`/api/monitors/${id}`),
    select: (data) => data.monitor,
    enabled: !!id,
  });
}

export function useMonitorChecks(id: string, limit = 50) {
  return useQuery({
    queryKey: ["monitors", id, "checks", limit],
    queryFn: () =>
      api.get<{ checks: CheckResult[] }>(`/api/monitors/${id}/checks?limit=${limit}`),
    select: (data) => data.checks,
    enabled: !!id,
  });
}

export function useCreateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ monitor: Monitor }>("/api/monitors", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  });
}

export function useUpdateMonitor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch<{ monitor: Monitor }>(`/api/monitors/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitors"] });
      qc.invalidateQueries({ queryKey: ["monitors", id] });
    },
  });
}

export function useDeleteMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/monitors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  });
}
