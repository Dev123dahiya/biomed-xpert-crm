import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { Customer, CustomerLead, Paginated } from "../types";

export interface CustomerQuery { search?: string; city?: string; state?: string; page?: number; pageSize?: number; sort?: string }

export const useCustomers = (params: CustomerQuery, enabled = true) =>
  useQuery({
    queryKey: ["customers", params],
    enabled,
    placeholderData: keepPreviousData,
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

export const useCustomerLeads = (id?: string) =>
  useQuery({
    queryKey: ["customer", id, "leads"],
    enabled: Boolean(id),
    queryFn: async () => unwrap<CustomerLead[]>((await api.get(`/customers/${id}/timeline`)).data),
  });

export const useCustomerMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["customer"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
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
    importMany: useMutation({
      mutationFn: async (rows: Record<string, unknown>[]) =>
        unwrap<{ created: number; skipped: number; errors: { row: number; message: string }[] }>((await api.post("/customers/import", { rows })).data),
      onSuccess: invalidate,
    }),
  };
};
