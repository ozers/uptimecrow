import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OnCallContact {
  id: string;
  scheduleId: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: number;
  createdAt: string;
}

export interface OnCallSchedule {
  id: string;
  orgId: string;
  name: string;
  rotationDays: number;
  createdAt: string;
}

interface OnCallData {
  schedule: OnCallSchedule | null;
  contacts: OnCallContact[];
  current: OnCallContact | null;
}

export function useOnCall() {
  return useQuery<OnCallData>({
    queryKey: ["oncall"],
    queryFn: () => api.get<OnCallData>("/api/oncall"),
  });
}

export function useUpsertSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; rotationDays?: number }) =>
      api.put("/api/oncall", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oncall"] }),
  });
}

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string }) =>
      api.post("/api/oncall/contacts", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oncall"] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; email?: string; phone?: string; position?: number }) =>
      api.patch(`/api/oncall/contacts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oncall"] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/oncall/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oncall"] }),
  });
}
