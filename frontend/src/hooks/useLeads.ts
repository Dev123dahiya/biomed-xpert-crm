import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { BoardColumn, LeadDetail, LeadStatus, Paginated, LeadSummary } from "../types";

export interface LeadListQuery { status?: LeadStatus; search?: string; customerId?: string; page?: number }

export const useLeadBoard = (filters: { priority?: string } = {}) =>
  useQuery({
    queryKey: ["leads", "board", filters],
    queryFn: async () => unwrap<{ columns: BoardColumn[] }>((await api.get("/leads/board", { params: filters })).data),
  });

export const useLeadList = (params: LeadListQuery) =>
  useQuery({
    queryKey: ["leads", "list", params],
    queryFn: async () => {
      const res = await api.get("/leads", { params });
      return { items: unwrap<LeadSummary[]>(res.data), meta: res.data.meta } as Paginated<LeadSummary>;
    },
  });

export const useLead = (id?: string) =>
  useQuery({
    queryKey: ["lead", id],
    enabled: Boolean(id),
    queryFn: async () => unwrap<LeadDetail>((await api.get(`/leads/${id}`)).data),
  });

export const useLeadMutations = (id?: string) => {
  const qc = useQueryClient();
  const invalidate = (): void => {
    qc.invalidateQueries({ queryKey: ["leads"] });
    if (id) qc.invalidateQueries({ queryKey: ["lead", id] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["customers"] });
  };
  const post = (path: string) => async (body: unknown) => unwrap<LeadDetail>((await api.post(path, body)).data);

  return {
    create: useMutation({
      mutationFn: async (body: unknown) => unwrap<LeadDetail>((await api.post("/leads", body)).data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async (body: unknown) => unwrap<LeadDetail>((await api.patch(`/leads/${id}`, body)).data),
      onSuccess: invalidate,
    }),
    changeStatus: useMutation({
      mutationFn: async (body: { toStatus: LeadStatus; note?: string }) =>
        unwrap<LeadDetail>((await api.patch(`/leads/${id}/status`, body)).data),
      onSuccess: invalidate,
    }),
    setProducts: useMutation({
      mutationFn: async (products: unknown[]) => unwrap<LeadDetail>((await api.put(`/leads/${id}/products`, { products })).data),
      onSuccess: invalidate,
    }),
    markWon: useMutation({ mutationFn: post(`/leads/${id}/won`), onSuccess: invalidate }),
    markLost: useMutation({ mutationFn: post(`/leads/${id}/lost`), onSuccess: invalidate }),
    addFollowUp: useMutation({
      mutationFn: async (body: { dueAt: string; note?: string }) =>
        (await api.post(`/leads/${id}/followups`, body)).data,
      onSuccess: invalidate,
    }),
    toggleFollowUp: useMutation({
      mutationFn: async ({ followUpId, done }: { followUpId: string; done: boolean }) =>
        (await api.patch(`/leads/${id}/followups/${followUpId}`, { done })).data,
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (leadId: string) => (await api.delete(`/leads/${leadId}`)).data,
      onSuccess: invalidate,
    }),
  };
};
