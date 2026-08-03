import { toNumber } from "../../utils/money";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const serializeLead = (lead: any) => ({
  id: lead.id,
  status: lead.status,
  approxValue: toNumber(lead.approxValue),
  priority: lead.priority,
  notes: lead.notes,
  sourceOther: lead.sourceOther,
  createdAt: lead.createdAt,
  updatedAt: lead.updatedAt,
  customer: lead.customer
    ? { id: lead.customer.id, customerName: lead.customer.customerName, company: lead.customer.company, phone: lead.customer.phone, email: lead.customer.email, gstin: lead.customer.gstin, city: lead.customer.city }
    : undefined,
  source: lead.source ? { id: lead.source.id, name: lead.source.name } : undefined,
  owner: lead.owner ? { id: lead.owner.id, name: lead.owner.name } : null,
  products: (lead.products ?? []).map((p: any) => ({
    id: p.id,
    productId: p.productId,
    name: p.product?.name,
    make: p.product?.make,
    model: p.product?.model,
    quantity: p.quantity,
    price: toNumber(p.price),
    lineTotal: toNumber(p.lineTotal),
  })),
  timeline: (lead.timeline ?? []).map((t: any) => ({
    id: t.id,
    fromStatus: t.fromStatus,
    toStatus: t.toStatus,
    note: t.note,
    actor: t.actor ? t.actor.name : null,
    createdAt: t.createdAt,
  })),
  quotes: (lead.quotes ?? []).map((q: any) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    quoteDate: q.quoteDate,
    fileUrl: q.fileUrl,
    remarks: q.remarks,
  })),
  followUps: (lead.followUps ?? []).map((f: any) => ({ id: f.id, dueAt: f.dueAt, note: f.note, done: f.done })),
  wonDeal: lead.wonDeal
    ? {
        id: lead.wonDeal.id,
        finalValue: toNumber(lead.wonDeal.finalValue),
        invoiceNumber: lead.wonDeal.invoiceNumber,
        closingDate: lead.wonDeal.closingDate,
        products: (lead.wonDeal.products ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          make: p.make,
          model: p.model,
          quantity: p.quantity,
          amount: toNumber(p.amount),
        })),
      }
    : null,
  lostDeal: lead.lostDeal
    ? { id: lead.lostDeal.id, reason: lead.lostDeal.reason, competitor: lead.lostDeal.competitor, remarks: lead.lostDeal.remarks }
    : null,
});

export const fullLeadInclude = {
  customer: true,
  source: true,
  owner: { select: { id: true, name: true } },
  products: { include: { product: true } },
  timeline: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
  quotes: { orderBy: { createdAt: "desc" } },
  followUps: { orderBy: { dueAt: "asc" } },
  wonDeal: { include: { products: true } },
  lostDeal: true,
} as const;
