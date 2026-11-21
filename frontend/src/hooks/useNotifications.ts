import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { Notification } from "../types";

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => unwrap<Notification[]>((await api.get("/notifications")).data),
  });

export const useNotificationMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  return {
    readAll: useMutation({ mutationFn: async () => (await api.patch("/notifications/read-all")).data, onSuccess: invalidate }),
    read: useMutation({ mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data, onSuccess: invalidate }),
  };
};
