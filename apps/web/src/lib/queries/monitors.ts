import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Monitor, CheckResult } from "@uptimecrow/shared";
import { api } from "../api";
import { analytics } from "../analytics";

export function useMonitors() {
  return useQuery({
    queryKey: ["monitors"],
    queryFn: () => api.get<{ monitors: Monitor[] }>("/api/monitors"),
    select: (data) => data.monitors,
  });
}

// Creating a monitor queues an immediate check, which lands a second or two
// later. Without polling, someone who just created one arrives on the detail
// page, reads "No checks recorded yet" and has no idea anything is coming — the
// whole reason we send them here is to watch the first result appear.
const FIRST_CHECK_POLL_MS = 3000;
const FIRST_CHECK_POLL_WINDOW_MS = 30_000;

export function useMonitor(id: string, options: { pollUntilChecked?: boolean } = {}) {
  const startedAt = useRef(Date.now());

  return useQuery({
    queryKey: ["monitors", id],
    queryFn: () => api.get<{ monitor: Monitor }>(`/api/monitors/${id}`),
    select: (data) => data.monitor,
    enabled: !!id,
    refetchInterval: (query) => {
      if (!options.pollUntilChecked) return false;
      const monitor = query.state.data?.monitor;
      // Stop as soon as a result exists, and give up rather than polling a
      // queue that is clearly not running.
      if (monitor?.lastCheckedAt) return false;
      if (Date.now() - startedAt.current > FIRST_CHECK_POLL_WINDOW_MS) return false;
      return FIRST_CHECK_POLL_MS;
    },
  });
}

export function useMonitorChecks(
  id: string,
  limit = 50,
  options: { pollWhileEmpty?: boolean } = {},
) {
  const startedAt = useRef(Date.now());

  return useQuery({
    queryKey: ["monitors", id, "checks", limit],
    queryFn: () =>
      api.get<{ checks: CheckResult[] }>(`/api/monitors/${id}/checks?limit=${limit}`),
    select: (data) => data.checks,
    enabled: !!id,
    // Same reason as useMonitor: the history is empty for the first couple of
    // seconds after a monitor is created, and it should fill itself in.
    refetchInterval: (query) => {
      if (!options.pollWhileEmpty) return false;
      if ((query.state.data?.checks?.length ?? 0) > 0) return false;
      if (Date.now() - startedAt.current > FIRST_CHECK_POLL_WINDOW_MS) return false;
      return FIRST_CHECK_POLL_MS;
    },
  });
}

export function useCreateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ monitor: Monitor }>("/api/monitors", data),
    onSuccess: (_, variables) => {
      analytics.monitorCreated(String(variables.type ?? "http"));
      qc.invalidateQueries({ queryKey: ["monitors"] });
    },
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
    onSuccess: () => {
      analytics.monitorDeleted();
      qc.invalidateQueries({ queryKey: ["monitors"] });
    },
  });
}
