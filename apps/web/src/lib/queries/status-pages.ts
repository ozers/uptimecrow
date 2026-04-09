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

export function useStatusPage(id: string) {
  return useQuery({
    queryKey: ["status-pages", id],
    queryFn: () => api.get<{ statusPage: StatusPage }>(`/api/status-pages/${id}`),
    select: (data) => data.statusPage,
    enabled: !!id,
  });
}

export function useCreateStatusPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ statusPage: StatusPage }>("/api/status-pages", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status-pages"] }),
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
