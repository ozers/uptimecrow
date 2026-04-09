import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Subscriber } from "@uptimecrow/shared";
import { api } from "../api";

export function useSubscribers(statusPageId: string) {
  return useQuery({
    queryKey: ["subscribers", statusPageId],
    queryFn: () =>
      api.get<{ subscribers: Subscriber[] }>(`/api/subscribers?statusPageId=${statusPageId}`),
    select: (data) => data.subscribers,
    enabled: !!statusPageId,
  });
}

export function useDeleteSubscriber(statusPageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/subscribers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers", statusPageId] }),
  });
}
