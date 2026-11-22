import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { DashboardOverview } from "../types";

export const useDashboard = (range: { from?: string; to?: string; compareFrom?: string; compareTo?: string } = {}) =>
  useQuery({
    queryKey: ["dashboard", range],
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap<DashboardOverview>((await api.get("/dashboard", { params: range })).data),
  });
