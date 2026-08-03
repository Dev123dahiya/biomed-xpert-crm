import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { DashboardOverview } from "../types";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard");
      return unwrap<DashboardOverview>(res.data);
    },
  });
