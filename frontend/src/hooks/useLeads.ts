import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import type { BoardColumn, LeadDetail, LeadStatus, Paginated, LeadSummary, Quote } from "../types";

export interface LeadFilters { priority?: string; sourceId?: string; ownerId?: string; search?: string; customerId?: string }
export interface LeadListQuery extends LeadFilters { status?: LeadStatus; stage?: "open" | "closed"; page?: number; pageSize?: number; sort?: string }

const clean = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as Partial<T>;

export const useLeadBoard = (filters: LeadFilters = {}) =>
  useQuery({
    queryKey: ["leads", "board", clean(filters)],
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap<{ columns: BoardColumn[] }>((await api.get("/leads/board", { params: clean(filters) })).data),
  });

export const useLeadList = (params: LeadListQuery) =>
  useQuery({
    queryKey: ["leads", "list", clean(params)],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get("/leads", { params: clean(params) });
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
    qc.invalidateQueries({ queryKey: ["customer"] });
    qc.invalidateQueries({ queryKey: ["followups"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  const post = (path: string) => async (body: unknown) => unwrap<LeadDetail>((await api.post(path, body)).data);
  const patch = (path: string) => async (body: unknown) => unwrap<LeadDetail>((await api.patch(path, body)).data);

  return {
    create: useMutation({
      mutationFn: async (body: unknown) => unwrap<LeadDetail>((await api.post("/leads", body)).data),
      onSuccess: invalidate,
    }),
    update: useMutation({ mutationFn: patch(`/leads/${id}`), onSuccess: invalidate }),
    changeStatus: useMutation({
      mutationFn: async (body: { toStatus: LeadStatus; note?: string; leadId?: string }) =>
        unwrap<LeadDetail>((await api.patch(`/leads/${body.leadId ?? id}/status`, { toStatus: body.toStatus, note: body.note })).data),
      onSuccess: invalidate,
    }),
    setProducts: useMutation({
      mutationFn: async (products: { productId: string; quantity: number; price?: number }[]) =>
        unwrap<LeadDetail>((await api.put(`/leads/${id}/products`, { products })).data),
      onSuccess: invalidate,
    }),
    markWon: useMutation({ mutationFn: post(`/leads/${id}/won`), onSuccess: invalidate }),
    updateWon: useMutation({ mutationFn: patch(`/leads/${id}/won`), onSuccess: invalidate }),
    markLost: useMutation({ mutationFn: post(`/leads/${id}/lost`), onSuccess: invalidate }),
    updateLost: useMutation({ mutationFn: patch(`/leads/${id}/lost`), onSuccess: invalidate }),
    addFollowUp: useMutation({
      mutationFn: async (body: { dueAt: string; note?: string }) => (await api.post(`/leads/${id}/followups`, body)).data,
      onSuccess: invalidate,
    }),
    updateFollowUp: useMutation({
      mutationFn: async ({ followUpId, leadId, ...body }: { followUpId: string; leadId?: string; done?: boolean; dueAt?: string; note?: string }) =>
        (await api.patch(`/leads/${leadId ?? id}/followups/${followUpId}`, body)).data,
      onSuccess: invalidate,
    }),
    removeFollowUp: useMutation({
      mutationFn: async (followUpId: string) => (await api.delete(`/leads/${id}/followups/${followUpId}`)).data,
      onSuccess: invalidate,
    }),
    addQuote: useMutation({
      mutationFn: async (body: { quoteNumber: string; quoteDate: string; remarks?: string; file?: File | null }) => {
        const fd = new FormData();
        fd.append("quoteNumber", body.quoteNumber);
        fd.append("quoteDate", body.quoteDate);
        if (body.remarks) fd.append("remarks", body.remarks);
        if (body.file) fd.append("file", body.file);
        return unwrap<Quote>((await api.post(`/leads/${id}/quotes`, fd)).data);
      },
      onSuccess: invalidate,
    }),
    removeQuote: useMutation({
      mutationFn: async (quoteId: string) => (await api.delete(`/leads/${id}/quotes/${quoteId}`)).data,
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (leadId: string) => (await api.delete(`/leads/${leadId}`)).data,
      onSuccess: () => {
        qc.removeQueries({ queryKey: ["lead", id] });
        qc.invalidateQueries({ queryKey: ["leads"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["followups"] });
      },
    }),
  };
};
