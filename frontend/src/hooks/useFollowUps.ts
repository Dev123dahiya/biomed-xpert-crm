import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { FollowUpRow, PaginationMeta } from "../types";

export type FollowUpScope = "overdue" | "today" | "week" | "upcoming" | "done" | "all";

export const useFollowUps = (scope: FollowUpScope, mine: boolean, page = 1) =>
  useQuery({
    queryKey: ["followups", scope, mine, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get("/followups", { params: { scope, mine: mine ? "true" : undefined, page } });
      return {
        items: unwrap<FollowUpRow[]>(res.data),
        meta: res.data.meta as PaginationMeta & { counts: { overdue: number; today: number; upcoming: number } },
      };
    },
  });
