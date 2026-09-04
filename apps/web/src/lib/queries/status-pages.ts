import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StatusPage } from "@uptimecrow/shared";
import { api } from "../api";

export function useStatusPages() {
  return useQuery({
    queryKey: ["status-pages"],
    queryFn: () => api.get<{ statusPages: StatusPage[] }>("/api/status-pages"),
    select: (data) => data.statusPages,
  });
}

export type StatusPageMonitorEntry = { monitorId: string; groupName: string | null };

export function useStatusPage(id: string) {
  return useQuery({
    queryKey: ["status-pages", id],
    queryFn: () => api.get<{ statusPage: StatusPage; monitors: StatusPageMonitorEntry[] }>(`/api/status-pages/${id}`),
    enabled: !!id,
  });
}

export function useSetStatusPageMonitors(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (monitors: StatusPageMonitorEntry[]) =>
      api.put<{ ok: boolean }>(`/api/status-pages/${id}/monitors`, { monitors }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status-pages", id] });
    },
  });
}

export function useUpdateStatusPage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch<{ statusPage: StatusPage }>(`/api/status-pages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status-pages"] });
      qc.invalidateQueries({ queryKey: ["status-pages", id] });
    },
  });
}

export function useDeleteStatusPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/status-pages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status-pages"] }),
  });
}

export function useRegenerateAccessToken(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ accessToken: string }>(`/api/status-pages/${id}/regenerate-token`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status-pages", id] });
      qc.invalidateQueries({ queryKey: ["status-pages"] });
    },
  });
}
