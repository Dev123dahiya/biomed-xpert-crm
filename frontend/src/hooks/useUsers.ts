import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { Paginated, UserRecord } from "../types";

export const useUsers = (enabled: boolean) =>
  useQuery({
    queryKey: ["users"],
    enabled,
    queryFn: async () => {
      const res = await api.get("/users", { params: { pageSize: 100, sort: "name" } });
      return { items: unwrap<UserRecord[]>(res.data), meta: res.data.meta } as Paginated<UserRecord>;
    },
  });

export const useUserMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["team"] });
    qc.invalidateQueries({ queryKey: ["roles"] });
  };
  return {
    create: useMutation({
      mutationFn: async (body: { name: string; email: string; password: string; roleId: string }) => (await api.post("/users", body)).data,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...body }: { id: string; name?: string; email?: string; password?: string; roleId?: string; active?: boolean }) =>
        (await api.patch(`/users/${id}`, body)).data,
      onSuccess: invalidate,
    }),
  };
};
