import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { Customer, Paginated } from "../types";

export interface CustomerQuery { search?: string; city?: string; page?: number; pageSize?: number; sort?: string }

export const useCustomers = (params: CustomerQuery) =>
  useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const res = await api.get("/customers", { params });
      return { items: unwrap<Customer[]>(res.data), meta: res.data.meta } as Paginated<Customer>;
    },
  });

export const useCustomer = (id?: string) =>
  useQuery({
    queryKey: ["customer", id],
    enabled: Boolean(id),
    queryFn: async () => unwrap<Customer>((await api.get(`/customers/${id}`)).data),
  });

export const useCustomerMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers"] });
  return {
    create: useMutation({
      mutationFn: async (body: Partial<Customer>) => unwrap<Customer>((await api.post("/customers", body)).data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, body }: { id: string; body: Partial<Customer> }) =>
        unwrap<Customer>((await api.patch(`/customers/${id}`, body)).data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => (await api.delete(`/customers/${id}`)).data,
      onSuccess: invalidate,
    }),
  };
};
