import { api, unwrap } from "../../lib/api";
import type { Customer, LeadSummary } from "../../types";
import type { ComboOption } from "./Combobox";
import { stageLabel } from "../../lib/stages";
import { inrCompact } from "../../lib/format";

export const customerOption = (c: Pick<Customer, "id" | "customerName" | "company" | "city">): ComboOption => ({
  id: c.id,
  label: c.customerName,
  sub: [c.company, c.city].filter(Boolean).join(", ") || undefined,
});

export const searchCustomers = async (q: string): Promise<ComboOption[]> => {
  const res = await api.get("/customers", { params: { search: q || undefined, pageSize: 20, sort: q ? undefined : "-createdAt" } });
  return unwrap<Customer[]>(res.data).map(customerOption);
};

export const searchLeads = async (q: string): Promise<ComboOption[]> => {
  const res = await api.get("/leads", { params: { search: q || undefined, pageSize: 20, sort: "-updatedAt" } });
  return unwrap<LeadSummary[]>(res.data).map((l) => ({
    id: l.id,
    label: l.customer.company ?? l.customer.customerName,
    sub: `${stageLabel(l.status)}, ${inrCompact(l.approxValue)}${l.customer.company ? `, ${l.customer.customerName}` : ""}`,
  }));
};
