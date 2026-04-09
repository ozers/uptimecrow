import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Incident, IncidentUpdate } from "@uptimecrow/shared";
import { api } from "../api";

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.get<{ incidents: Incident[] }>("/api/incidents"),
    select: (data) => data.incidents,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: () =>
      api.get<{ incident: Incident; updates: IncidentUpdate[] }>(`/api/incidents/${id}`),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ incident: Incident }>("/api/incidents", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useUpdateIncident(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch<{ incident: Incident }>(`/api/incidents/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incidents", id] });
    },
  });
}

export function useCreateIncidentUpdate(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; body: string }) =>
      api.post<{ update: IncidentUpdate }>(`/api/incidents/${incidentId}/updates`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incidents", incidentId] });
    },
  });
}
