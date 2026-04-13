import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MaintenanceWindow } from "@uptimecrow/shared";
import { api } from "../api";

export function useMaintenanceWindows() {
  return useQuery({
    queryKey: ["maintenance-windows"],
    queryFn: () =>
      api.get<{ maintenanceWindows: MaintenanceWindow[] }>("/api/maintenance-windows"),
    select: (data) => data.maintenanceWindows,
  });
}

export function useCreateMaintenanceWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      statusPageId: string;
      title: string;
      body?: string;
      scheduledStart: string;
      scheduledEnd: string;
      monitorIds: string[];
    }) =>
      api.post<{ maintenanceWindow: MaintenanceWindow }>(
        "/api/maintenance-windows",
        data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-windows"] }),
  });
}

export function useUpdateMaintenanceWindow(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch<{ ok: true }>(`/api/maintenance-windows/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-windows"] }),
  });
}

export function useDeleteMaintenanceWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/api/maintenance-windows/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-windows"] }),
  });
}
