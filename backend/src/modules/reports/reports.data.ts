import { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/AppError";
import { toNumber } from "../../utils/money";
import { ReportTable } from "./reports.types";

const money = (v: Prisma.Decimal | number | string | null | undefined): number => toNumber(v);
const dateStr = (d: Date | null | undefined): string => (d ? new Date(d).toISOString().slice(0, 10) : "");

interface DateFilter { from?: Date; to?: Date }
const range = (f: DateFilter): Prisma.DateTimeFilter | undefined =>
  f.from || f.to ? { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } : undefined;

export const reportsData = {
  async customers(f: DateFilter & { city?: string; state?: string }): Promise<ReportTable> {
    const where: Prisma.CustomerWhereInput = {};
    if (f.city) where.city = { equals: f.city, mode: "insensitive" };
    if (f.state) where.state = { equals: f.state, mode: "insensitive" };
    const rows = await prisma.customer.findMany({ where, include: { _count: { select: { leads: true } } }, orderBy: { totalValue: "desc" } });
    return {
      title: "Customer report",
      columns: [
        { header: "Customer", key: "customer", width: 26 },
        { header: "Company", key: "company", width: 24 },
        { header: "City", key: "city", width: 14 },
        { header: "GSTIN", key: "gstin", width: 18 },
        { header: "Phone", key: "phone", width: 14 },
        { header: "Balance", key: "balance", width: 14 },
        { header: "Total Value", key: "totalValue", width: 16 },
        { header: "Leads", key: "leads", width: 8 },
      ],
      rows: rows.map((c) => ({
        customer: c.customerName,
        company: c.company ?? "",
        city: c.city ?? "",
        gstin: c.gstin ?? "",
        phone: c.phone ?? "",
        balance: money(c.balance),
        totalValue: money(c.totalValue),
        leads: c._count.leads,
      })),
    };
  },

  async leads(f: DateFilter & { status?: LeadStatus; sourceId?: string; ownerId?: string }): Promise<ReportTable> {
    const where: Prisma.LeadWhereInput = {};
    if (f.status) where.status = f.status;
    if (f.sourceId) where.sourceId = f.sourceId;
    if (f.ownerId) where.ownerId = f.ownerId;
    const cr = range(f);
    if (cr) where.createdAt = cr;
    const rows = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { customerName: true, company: true } }, source: { select: { name: true } }, owner: { select: { name: true } }, wonDeal: { select: { finalValue: true } } },
    });
    return {
      title: "Lead report",
      columns: [
        { header: "Customer", key: "customer", width: 26 },
        { header: "Company", key: "company", width: 22 },
        { header: "Status", key: "status", width: 14 },
        { header: "Source", key: "source", width: 16 },
        { header: "Owner", key: "owner", width: 16 },
        { header: "Approx Value", key: "approxValue", width: 16 },
        { header: "Final Value", key: "finalValue", width: 16 },
        { header: "Created", key: "created", width: 12 },
      ],
      rows: rows.map((l) => ({
        customer: l.customer.customerName,
        company: l.customer.company ?? "",
        status: l.status,
        source: l.source.name,
        owner: l.owner?.name ?? "",
        approxValue: money(l.approxValue),
        finalValue: l.wonDeal ? money(l.wonDeal.finalValue) : 0,
        created: dateStr(l.createdAt),
      })),
    };
  },

  async revenue(f: DateFilter & { groupBy?: "month" | "customer" }): Promise<ReportTable> {
    const wr: Prisma.WonDealWhereInput = {};
    const cr = range(f);
    if (cr) wr.closingDate = cr;
    const deals = await prisma.wonDeal.findMany({ where: wr, include: { lead: { include: { customer: { select: { customerName: true } } } } } });
    const buckets = new Map<string, number>();
    for (const d of deals) {
      const key =
        f.groupBy === "customer"
          ? d.lead.customer.customerName
          : (d.closingDate ?? d.createdAt).toISOString().slice(0, 7);
      buckets.set(key, (buckets.get(key) ?? 0) + money(d.finalValue));
    }
    const label = f.groupBy === "customer" ? "Customer" : "Month";
    return {
      title: "Revenue report",
      columns: [
        { header: label, key: "key", width: 26 },
        { header: "Revenue", key: "revenue", width: 18 },
      ],
      rows: [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, revenue]) => ({ key, revenue })),
    };
  },

  async sales(f: DateFilter & { ownerId?: string }): Promise<ReportTable> {
    const wr: Prisma.WonDealWhereInput = {};
    const cr = range(f);
    if (cr) wr.closingDate = cr;
    if (f.ownerId) wr.lead = { ownerId: f.ownerId };
    const deals = await prisma.wonDeal.findMany({ where: wr, include: { lead: { include: { owner: { select: { name: true } } } } } });
    const byOwner = new Map<string, { deals: number; revenue: number }>();
    for (const d of deals) {
      const name = d.lead.owner?.name ?? "Unassigned";
      const cur = byOwner.get(name) ?? { deals: 0, revenue: 0 };
      cur.deals += 1;
      cur.revenue += money(d.finalValue);
      byOwner.set(name, cur);
    }
    return {
      title: "Sales report",
      columns: [
        { header: "Sales User", key: "owner", width: 24 },
        { header: "Won Deals", key: "deals", width: 12 },
        { header: "Revenue", key: "revenue", width: 18 },
      ],
      rows: [...byOwner.entries()].map(([owner, v]) => ({ owner, deals: v.deals, revenue: v.revenue })),
    };
  },

  async monthly(year: number): Promise<ReportTable> {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const [leads, deals] = await Promise.all([
      prisma.lead.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { createdAt: true } }),
      prisma.wonDeal.findMany({ where: { OR: [{ closingDate: { gte: start, lt: end } }, { AND: [{ closingDate: null }, { createdAt: { gte: start, lt: end } }] }] }, select: { finalValue: true, closingDate: true, createdAt: true } }),
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const rows = monthNames.map((name, i) => {
      const leadCount = leads.filter((l) => l.createdAt.getMonth() === i).length;
      const monthDeals = deals.filter((d) => (d.closingDate ?? d.createdAt).getMonth() === i);
      return { month: name, leads: leadCount, wonDeals: monthDeals.length, revenue: monthDeals.reduce((s, d) => s + money(d.finalValue), 0) };
    });
    return {
      title: `Monthly report ${year}`,
      columns: [
        { header: "Month", key: "month", width: 10 },
        { header: "Leads", key: "leads", width: 10 },
        { header: "Won Deals", key: "wonDeals", width: 12 },
        { header: "Revenue", key: "revenue", width: 18 },
      ],
      rows,
    };
  },

  async customerDetail(id: string): Promise<ReportTable> {
    const c = await prisma.customer.findUnique({ where: { id }, include: { leads: { include: { wonDeal: true, lostDeal: true } } } });
    if (!c) throw AppError.notFound("Customer not found");
    const rows: Record<string, unknown>[] = [
      { field: "Customer", value: c.customerName },
      { field: "Contact Person", value: c.contactPerson ?? "" },
      { field: "Company", value: c.company ?? "" },
      { field: "GSTIN", value: c.gstin ?? "" },
      { field: "Phone", value: c.phone ?? "" },
      { field: "Email", value: c.email ?? "" },
      { field: "Address", value: [c.addressLine1, c.addressLine2, c.city, c.state, c.pinCode, c.country].filter(Boolean).join(", ") },
      { field: "Balance", value: money(c.balance) },
      { field: "Total Value", value: money(c.totalValue) },
    ];
    for (const l of c.leads) {
      rows.push({ field: `Lead ${l.id.slice(0, 6)}`, value: `${l.status} | approx ${money(l.approxValue)}${l.wonDeal ? ` | won ${money(l.wonDeal.finalValue)}` : ""}${l.lostDeal ? ` | lost: ${l.lostDeal.reason}` : ""}` });
    }
    return { title: `Customer ${c.customerName}`, columns: [{ header: "Field", key: "field", width: 24 }, { header: "Value", key: "value", width: 60 }], rows };
  },

  async leadDetail(id: string): Promise<ReportTable> {
    const l = await prisma.lead.findUnique({
      where: { id },
      include: { customer: true, source: true, owner: { select: { name: true } }, products: { include: { product: true } }, wonDeal: { include: { products: true } }, lostDeal: true, timeline: { orderBy: { createdAt: "asc" } } },
    });
    if (!l) throw AppError.notFound("Lead not found");
    const rows: Record<string, unknown>[] = [
      { field: "Customer", value: l.customer.customerName },
      { field: "Company", value: l.customer.company ?? "" },
      { field: "Status", value: l.status },
      { field: "Source", value: l.source.name + (l.sourceOther ? ` (${l.sourceOther})` : "") },
      { field: "Owner", value: l.owner?.name ?? "" },
      { field: "Approx Value", value: money(l.approxValue) },
      { field: "Priority", value: l.priority },
      { field: "Notes", value: l.notes ?? "" },
    ];
    l.products.forEach((p, i) => rows.push({ field: `Product ${i + 1}`, value: `${p.product.name} ${p.product.make} ${p.product.model} x${p.quantity} @ ${money(p.price)} = ${money(p.lineTotal)}` }));
    if (l.wonDeal) rows.push({ field: "Won", value: `Final ${money(l.wonDeal.finalValue)} | Invoice ${l.wonDeal.invoiceNumber ?? ""} | Closed ${dateStr(l.wonDeal.closingDate)}` });
    if (l.lostDeal) rows.push({ field: "Lost", value: `Reason: ${l.lostDeal.reason} | Competitor: ${l.lostDeal.competitor ?? ""}` });
    l.timeline.forEach((t) => rows.push({ field: "Timeline", value: `${t.fromStatus ?? "-"} -> ${t.toStatus} @ ${dateStr(t.createdAt)}` }));
    return { title: `Lead ${l.customer.customerName}`, columns: [{ header: "Field", key: "field", width: 24 }, { header: "Value", key: "value", width: 70 }], rows };
  },

  async leadsByStage(stage: LeadStatus | undefined, f: DateFilter & { sourceId?: string; ownerId?: string }): Promise<ReportTable> {
    return this.leads({ ...f, status: stage });
  },
};
