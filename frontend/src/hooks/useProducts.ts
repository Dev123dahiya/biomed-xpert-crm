import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { Paginated, Product } from "../types";

export interface ProductQuery { search?: string; category?: string; page?: number; sort?: string }

export const useProducts = (params: ProductQuery) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await api.get("/products", { params });
      return { items: unwrap<Product[]>(res.data), meta: res.data.meta } as Paginated<Product>;
    },
  });

export const useProductMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });
  return {
    create: useMutation({
      mutationFn: async (body: Partial<Product>) => unwrap<Product>((await api.post("/products", body)).data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, body }: { id: string; body: Partial<Product> }) =>
        unwrap<Product>((await api.patch(`/products/${id}`, body)).data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data,
      onSuccess: invalidate,
    }),
  };
};
