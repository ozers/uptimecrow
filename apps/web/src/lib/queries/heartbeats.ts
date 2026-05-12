import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Heartbeat } from "@uptimecrow/shared";
import { api } from "../api";

export function useHeartbeats() {
  return useQuery({
    queryKey: ["heartbeats"],
    queryFn: () => api.get<Heartbeat[]>("/api/heartbeats"),
  });
}

export function useCreateHeartbeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; period: number; grace: number }) =>
      api.post<Heartbeat>("/api/heartbeats", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["heartbeats"] }),
  });
}

export function useUpdateHeartbeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; period?: number; grace?: number; isActive?: boolean }) =>
      api.patch<Heartbeat>(`/api/heartbeats/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["heartbeats"] }),
  });
}

export function useDeleteHeartbeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/heartbeats/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["heartbeats"] }),
  });
}
