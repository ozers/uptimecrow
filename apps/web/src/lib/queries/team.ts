import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OrgMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  name: string;
  email: string;
}

export interface OrgInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

interface TeamData {
  members: OrgMember[];
  invites: OrgInvite[];
  plan: string;
}

export function useTeam() {
  return useQuery<TeamData>({
    queryKey: ["team"],
    queryFn: () => api.get<TeamData>("/api/team"),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post("/api/team/invite", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/team/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useCancelInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api.delete(`/api/team/invites/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useInviteInfo(token: string | undefined) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () => api.get<{ invite: { email: string; role: string; orgName: string } }>(`/api/team/invite/${token}`),
    enabled: !!token,
  });
}
