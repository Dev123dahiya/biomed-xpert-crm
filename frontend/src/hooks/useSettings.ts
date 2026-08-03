import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { AppSettings } from "../types";

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => unwrap<AppSettings>((await api.get("/settings")).data),
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AppSettings) => unwrap<AppSettings>((await api.patch("/settings", body)).data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};
