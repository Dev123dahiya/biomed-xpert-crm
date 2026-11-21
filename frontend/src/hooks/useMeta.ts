import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { LeadSource, Product, Role, SearchResults, TeamMember } from "../types";

export const useLeadSources = () =>
  useQuery({
    queryKey: ["lead-sources"],
    staleTime: 5 * 60_000,
    queryFn: async () => unwrap<LeadSource[]>((await api.get("/lead-sources")).data),
  });

export const useLeadSourceMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["lead-sources"] });
  return {
    create: useMutation({ mutationFn: async (name: string) => (await api.post("/lead-sources", { name })).data, onSuccess: invalidate }),
    update: useMutation({ mutationFn: async ({ id, name }: { id: string; name: string }) => (await api.patch(`/lead-sources/${id}`, { name })).data, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: async (id: string) => (await api.delete(`/lead-sources/${id}`)).data, onSuccess: invalidate }),
  };
};

export const useRoles = (enabled = true) =>
  useQuery({
    queryKey: ["roles"],
    enabled,
    queryFn: async () => unwrap<Role[]>((await api.get("/roles")).data),
  });

export const useTeam = () =>
  useQuery({
    queryKey: ["team"],
    staleTime: 5 * 60_000,
    queryFn: async () => unwrap<TeamMember[]>((await api.get("/team")).data),
  });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ["search", q],
    enabled: q.trim().length > 0,
    staleTime: 15_000,
    queryFn: async () => unwrap<SearchResults>((await api.get("/search", { params: { q } })).data),
  });

export const useProductCategories = () =>
  useQuery({
    queryKey: ["products", "categories"],
    queryFn: async () => unwrap<{ name: string; count: number }[]>((await api.get("/products/categories")).data),
  });

export const searchProducts = async (q: string): Promise<Product[]> =>
  unwrap<Product[]>((await api.get("/products/autocomplete", { params: { q } })).data);
