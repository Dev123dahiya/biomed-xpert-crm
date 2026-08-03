import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { LeadSource, Product, Role } from "../types";

export const useLeadSources = () =>
  useQuery({
    queryKey: ["lead-sources"],
    queryFn: async () => unwrap<LeadSource[]>((await api.get("/lead-sources")).data),
  });

export const useRoles = () =>
  useQuery({
    queryKey: ["roles"],
    queryFn: async () => unwrap<Role[]>((await api.get("/roles")).data),
  });

export const searchProducts = async (q: string): Promise<Product[]> =>
  unwrap<Product[]>((await api.get("/products/autocomplete", { params: { q } })).data);
