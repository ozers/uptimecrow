import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Incident, IncidentUpdate } from "@uptimecrow/shared";
import { api } from "../api";
import { analytics } from "../analytics";

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.get<{ incidents: Incident[] }>("/api/incidents"),
    select: (data) => data.incidents,
  });
}

// Paginated incidents for the full list page ("Load more"). Kept separate from
// useIncidents() so the Overview's recent-incidents widget is unaffected.
const INCIDENTS_PAGE_SIZE = 25;
export function useInfiniteIncidents() {
  return useInfiniteQuery({
    queryKey: ["incidents", "infinite"],
    queryFn: ({ pageParam }) =>
      api.get<{ incidents: Incident[] }>(
        `/api/incidents?limit=${INCIDENTS_PAGE_SIZE}&offset=${pageParam}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.incidents.length < INCIDENTS_PAGE_SIZE
        ? undefined
        : allPages.length * INCIDENTS_PAGE_SIZE,
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
    onSuccess: (_, variables) => {
      analytics.incidentCreated(String(variables.severity ?? "minor"));
      qc.invalidateQueries({ queryKey: ["incidents"] });
    },
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
    onSuccess: (_, variables) => {
      if (variables.status === "resolved") analytics.incidentResolved();
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incidents", incidentId] });
    },
  });
}
