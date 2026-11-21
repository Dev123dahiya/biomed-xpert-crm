import { LeadStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/AppError";
import { PageParams, buildMeta, parseSort } from "../../common/pagination";
import { toNumber } from "../../utils/money";
import {
  MAX_PRODUCTS_PER_LEAD,
  canForwardTransition,
  followUpAllowed,
  isTerminal,
} from "./leads.constants";
import { fullLeadInclude, serializeLead } from "./leads.serializer";
import { adminIds, notify } from "../notifications/notify";
import {
  addProductSchema,
  createLeadSchema,
  followUpCreateSchema,
  followUpUpdateSchema,
  listLeadsSchema,
  lostSchema,
  lostUpdateSchema,
  replaceProductsSchema,
  updateLeadSchema,
  wonSchema,
  wonUpdateSchema,
} from "./leads.schema";

type Tx = Prisma.TransactionClient;
type ProductLine = { productId: string; quantity: number; price?: number };

const loadLead = async (id: string) => {
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, status: true, customerId: true } });
  if (!lead) throw AppError.notFound("Lead not found");
  return lead;
};

const fullLead = async (id: string) => {
  const lead = await prisma.lead.findUnique({ where: { id }, include: fullLeadInclude });
  if (!lead) throw AppError.notFound("Lead not found");
  return serializeLead(lead);
};

const ensureSourceOther = async (sourceId: string, sourceOther?: string): Promise<void> => {
  const source = await prisma.leadSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new AppError(404, "SOURCE_NOT_FOUND", "That lead source does not exist");
  if (source.name.toLowerCase() === "others" && (!sourceOther || sourceOther.trim() === "")) {
    throw new AppError(400, "SOURCE_OTHER_REQUIRED", "Describe the source when choosing Others");
  }
};

const buildProductLines = async (lines: ProductLine[]) => {
  if (lines.length > MAX_PRODUCTS_PER_LEAD) {
    throw new AppError(400, "TOO_MANY_PRODUCTS", `A lead can hold at most ${MAX_PRODUCTS_PER_LEAD} products`);
  }
  if (lines.length === 0) return [];
  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.map((l) => {
    const product = byId.get(l.productId);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "One of the products does not exist");
    const price = l.price ?? toNumber(product.unitPrice);
    return { productId: l.productId, quantity: l.quantity, price, lineTotal: price * l.quantity };
  });
};

const recomputeCustomerTotal = async (tx: Tx, customerId: string): Promise<void> => {
  const agg = await tx.wonDeal.aggregate({ _sum: { finalValue: true }, where: { lead: { customerId } } });
  await tx.customer.update({ where: { id: customerId }, data: { totalValue: agg._sum.finalValue ?? 0 } });
};

const OPEN: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.QUOTE_SHARED];

const buildWhere = (query: z.infer<typeof listLeadsSchema>, includeStatus: boolean): Prisma.LeadWhereInput => {
  const where: Prisma.LeadWhereInput = {};
  if (includeStatus && query.status) where.status = query.status;
  else if (includeStatus && query.stage === "open") where.status = { in: OPEN };
  else if (includeStatus && query.stage === "closed") where.status = { in: [LeadStatus.WON, LeadStatus.LOST] };
  if (query.customerId) where.customerId = query.customerId;
  if (query.ownerId === "none") where.ownerId = null;
  else if (query.ownerId) where.ownerId = query.ownerId;
  if (query.sourceId) where.sourceId = query.sourceId;
  if (query.priority) where.priority = query.priority;
  if (query.search) {
    const like = { contains: query.search, mode: "insensitive" as const };
    where.OR = [
      { notes: like },
      { customer: { customerName: like } },
      { customer: { company: like } },
      { customer: { phone: like } },
      { customer: { city: like } },
    ];
  }
  return where;
};

const customerLabel = (c?: { customerName: string; company: string | null } | null): string =>
  c ? c.company ?? c.customerName : "Customer";

export const leadsService = {
  async list(query: z.infer<typeof listLeadsSchema>, page: PageParams) {
    const where = buildWhere(query, true);
    const orderBy = parseSort(query.sort, ["createdAt", "updatedAt", "approxValue", "priority", "status"], { createdAt: "desc" });
    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        include: {
          customer: { select: { id: true, customerName: true, company: true, city: true } },
          source: { select: { name: true } },
          owner: { select: { id: true, name: true } },
          _count: { select: { products: true } },
          followUps: { where: { done: false }, orderBy: { dueAt: "asc" }, take: 1 },
          wonDeal: { select: { finalValue: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);
    const rows = items.map((l) => ({
      id: l.id,
      status: l.status,
      priority: l.priority,
      approxValue: toNumber(l.approxValue),
      customer: l.customer,
      source: l.source?.name,
      owner: l.owner,
      productCount: l._count.products,
      nextFollowUp: l.followUps[0]?.dueAt ?? null,
      finalValue: l.wonDeal ? toNumber(l.wonDeal.finalValue) : null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
    return { items: rows, meta: buildMeta(page, total) };
  },

  async board(query: z.infer<typeof listLeadsSchema>) {
    const where = buildWhere(query, false);

    const grouped = await prisma.lead.groupBy({ by: ["status"], where, _count: { _all: true }, _sum: { approxValue: true } });
    const counts = new Map(grouped.map((g) => [g.status, g._count._all]));
    const values = new Map(grouped.map((g) => [g.status, toNumber(g._sum.approxValue)]));
    // The Won column is worth what was actually ordered, not the original estimate.
    const wonAgg = await prisma.wonDeal.aggregate({ where: { lead: where }, _sum: { finalValue: true } });
    values.set(LeadStatus.WON, toNumber(wonAgg._sum.finalValue));
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 300,
      include: {
        customer: { select: { customerName: true, company: true, city: true } },
        owner: { select: { id: true, name: true } },
        source: { select: { name: true } },
        _count: { select: { products: true, quotes: true } },
        followUps: { where: { done: false }, orderBy: { dueAt: "asc" }, take: 1, select: { dueAt: true } },
        wonDeal: { select: { finalValue: true } },
      },
    });
    const buckets = new Map<LeadStatus, unknown[]>();
    for (const l of leads) {
      const card = {
        id: l.id,
        customer: l.customer?.company ?? l.customer?.customerName,
        approxValue: toNumber(l.approxValue),
        contact: l.customer?.customerName,
        city: l.customer?.city ?? null,
        priority: l.priority,
        productCount: l._count.products,
        quoteCount: l._count.quotes,
        owner: l.owner,
        source: l.source?.name ?? null,
        nextFollowUp: l.followUps[0]?.dueAt ?? null,
        finalValue: l.wonDeal ? toNumber(l.wonDeal.finalValue) : null,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      };
      const arr = buckets.get(l.status) ?? [];
      arr.push(card);
      buckets.set(l.status, arr);
    }
    const columns = ([
      LeadStatus.NEW,
      LeadStatus.CONTACTED,
      LeadStatus.QUALIFIED,
      LeadStatus.QUOTE_SHARED,
      LeadStatus.WON,
      LeadStatus.LOST,
    ] as LeadStatus[]).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
      value: values.get(status) ?? 0,
      leads: buckets.get(status) ?? [],
    }));
    return { columns };
  },

  async create(input: z.infer<typeof createLeadSchema>, ownerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new AppError(404, "CUSTOMER_NOT_FOUND", "That customer does not exist");
    await ensureSourceOther(input.sourceId, input.sourceOther);

    const status = input.status ?? LeadStatus.NEW;
    const lines = await buildProductLines(input.products);
    if (input.followUp && !followUpAllowed(status)) {
      throw new AppError(400, "FOLLOWUP_STAGE_INVALID", "Follow-ups are available from the Contacted stage");
    }
    if (input.ownerId) {
      const owner = await prisma.user.findFirst({ where: { id: input.ownerId, active: true } });
      if (!owner) throw new AppError(404, "USER_NOT_FOUND", "That teammate does not exist or is inactive");
    }

    const created = await prisma.lead.create({
      data: {
        customer: { connect: { id: input.customerId } },
        source: { connect: { id: input.sourceId } },
        sourceOther: input.sourceOther,
        status,
        approxValue: input.approxValue,
        priority: input.priority,
        notes: input.notes,
        owner: { connect: { id: input.ownerId ?? ownerId } },
        products: { create: lines },
        timeline: { create: { toStatus: status, actorId: ownerId, note: "Lead created" } },
        followUps: input.followUp ? { create: { dueAt: input.followUp.dueAt, note: input.followUp.note } } : undefined,
      },
    });
    if (input.ownerId && input.ownerId !== ownerId) {
      await notify([input.ownerId], "LEAD_ASSIGNED", `You were assigned a new lead for ${customer.company ?? customer.customerName}`, ownerId);
    }
    return fullLead(created.id);
  },

  get: (id: string) => fullLead(id),

  async update(id: string, input: z.infer<typeof updateLeadSchema>, actorId?: string) {
    const lead = await loadLead(id);
    const before = await prisma.lead.findUnique({ where: { id }, select: { ownerId: true, customer: { select: { customerName: true, company: true } } } });
    if (input.sourceId) await ensureSourceOther(input.sourceId, input.sourceOther);
    const data: Prisma.LeadUpdateInput = {};
    if (input.sourceId) data.source = { connect: { id: input.sourceId } };
    if (input.sourceOther !== undefined) data.sourceOther = input.sourceOther;
    if (input.approxValue !== undefined) data.approxValue = input.approxValue;
    if (input.priority) data.priority = input.priority;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.ownerId !== undefined) {
      if (input.ownerId) {
        const owner = await prisma.user.findFirst({ where: { id: input.ownerId, active: true } });
        if (!owner) throw new AppError(404, "USER_NOT_FOUND", "That teammate does not exist or is inactive");
        data.owner = { connect: { id: input.ownerId } };
      } else {
        data.owner = { disconnect: true };
      }
    }
    await prisma.lead.update({ where: { id: lead.id }, data });
    if (input.ownerId && input.ownerId !== before?.ownerId) {
      await notify([input.ownerId], "LEAD_ASSIGNED", `You were assigned the lead for ${customerLabel(before?.customer)}`, actorId);
    }
    return fullLead(id);
  },

  async remove(id: string) {
    const lead = await loadLead(id);
    await prisma.$transaction(async (tx) => {
      await tx.lead.delete({ where: { id } });
      // Keep the customer's lifetime value in step when a won lead is removed.
      await recomputeCustomerTotal(tx, lead.customerId);
    });
    return { deleted: true };
  },

  async changeStatus(id: string, toStatus: LeadStatus, note: string | undefined, actorId: string) {
    const lead = await loadLead(id);
    if (isTerminal(lead.status)) throw new AppError(409, "TERMINAL_LEAD", "This lead is already closed");
    if (!canForwardTransition(lead.status, toStatus)) {
      throw new AppError(409, "INVALID_TRANSITION", `Cannot move from ${lead.status} to ${toStatus}`);
    }
    await prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { status: toStatus } });
      await tx.leadTimeline.create({ data: { leadId: id, fromStatus: lead.status, toStatus, actorId, note } });
    });
    const info = await prisma.lead.findUnique({ where: { id }, select: { ownerId: true, customer: { select: { customerName: true, company: true } } } });
    await notify([info?.ownerId], "LEAD_STAGE", `${customerLabel(info?.customer)} moved to ${toStatus.replace("_", " ").toLowerCase()}`, actorId);
    return fullLead(id);
  },

  async timeline(id: string) {
    await loadLead(id);
    const rows = await prisma.leadTimeline.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
      include: { actor: { select: { name: true } } },
    });
    return rows.map((t) => ({ id: t.id, fromStatus: t.fromStatus, toStatus: t.toStatus, note: t.note, actor: t.actor?.name ?? null, createdAt: t.createdAt }));
  },

  async replaceProducts(id: string, input: z.infer<typeof replaceProductsSchema>) {
    await loadLead(id);
    const lines = await buildProductLines(input.products);
    await prisma.$transaction(async (tx) => {
      await tx.leadProduct.deleteMany({ where: { leadId: id } });
      if (lines.length > 0) await tx.leadProduct.createMany({ data: lines.map((l) => ({ ...l, leadId: id })) });
    });
    return fullLead(id);
  },

  async addProduct(id: string, input: z.infer<typeof addProductSchema>) {
    await loadLead(id);
    const count = await prisma.leadProduct.count({ where: { leadId: id } });
    if (count >= MAX_PRODUCTS_PER_LEAD) {
      throw new AppError(400, "TOO_MANY_PRODUCTS", `A lead can hold at most ${MAX_PRODUCTS_PER_LEAD} products`);
    }
    const [line] = await buildProductLines([input]);
    await prisma.leadProduct.create({ data: { ...line, leadId: id } });
    return fullLead(id);
  },

  async removeProduct(id: string, lineId: string) {
    await loadLead(id);
    const line = await prisma.leadProduct.findFirst({ where: { id: lineId, leadId: id } });
    if (!line) throw AppError.notFound("Product line not found");
    await prisma.leadProduct.delete({ where: { id: lineId } });
    return fullLead(id);
  },

  async listQuotes(id: string) {
    await loadLead(id);
    return prisma.quote.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" } });
  },

  async addQuote(id: string, meta: QuoteMeta, fileUrl: string | null) {
    await loadLead(id);
    return prisma.quote.create({
      data: { leadId: id, quoteNumber: meta.quoteNumber, quoteDate: meta.quoteDate, remarks: meta.remarks, fileUrl },
    });
  },

  async removeQuote(id: string, quoteId: string) {
    await loadLead(id);
    const quote = await prisma.quote.findFirst({ where: { id: quoteId, leadId: id } });
    if (!quote) throw AppError.notFound("Quote not found");
    await prisma.quote.delete({ where: { id: quoteId } });
    return { deleted: true };
  },

  async markWon(id: string, input: z.infer<typeof wonSchema>, actorId: string) {
    const lead = await prisma.lead.findUnique({ where: { id }, include: { products: { include: { product: true } } } });
    if (!lead) throw AppError.notFound("Lead not found");
    if (isTerminal(lead.status)) throw new AppError(409, "TERMINAL_LEAD", "This lead is already closed");

    const products =
      input.products ??
      lead.products.map((p) => ({
        name: p.product.name,
        make: p.product.make,
        model: p.product.model,
        quantity: p.quantity,
        amount: toNumber(p.lineTotal),
      }));

    await prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { status: LeadStatus.WON } });
      await tx.wonDeal.create({
        data: {
          leadId: id,
          finalValue: input.finalValue,
          invoiceNumber: input.invoiceNumber,
          closingDate: input.closingDate,
          products: { create: products },
        },
      });
      await tx.leadTimeline.create({ data: { leadId: id, fromStatus: lead.status, toStatus: LeadStatus.WON, actorId, note: "Marked won" } });
      await recomputeCustomerTotal(tx, lead.customerId);
    });
    const info = await prisma.lead.findUnique({ where: { id }, select: { ownerId: true, customer: { select: { customerName: true, company: true } } } });
    await notify(
      [info?.ownerId, ...(await adminIds())],
      "LEAD_WON",
      `Deal won with ${customerLabel(info?.customer)} for ₹${Math.round(input.finalValue).toLocaleString("en-IN")}`,
      actorId,
    );
    return fullLead(id);
  },

  async getWon(id: string) {
    const won = await prisma.wonDeal.findUnique({ where: { leadId: id }, include: { products: true } });
    if (!won) throw AppError.notFound("This lead has no won record");
    return { id: won.id, finalValue: toNumber(won.finalValue), invoiceNumber: won.invoiceNumber, closingDate: won.closingDate, products: won.products.map((p) => ({ ...p, amount: toNumber(p.amount) })) };
  },

  async updateWon(id: string, input: z.infer<typeof wonUpdateSchema>) {
    const lead = await loadLead(id);
    const won = await prisma.wonDeal.findUnique({ where: { leadId: id } });
    if (!won) throw AppError.notFound("This lead has no won record");
    await prisma.$transaction(async (tx) => {
      await tx.wonDeal.update({
        where: { leadId: id },
        data: {
          finalValue: input.finalValue,
          invoiceNumber: input.invoiceNumber,
          closingDate: input.closingDate,
        },
      });
      if (input.products) {
        await tx.wonDealProduct.deleteMany({ where: { wonDealId: won.id } });
        await tx.wonDealProduct.createMany({ data: input.products.map((p) => ({ ...p, wonDealId: won.id })) });
      }
      await recomputeCustomerTotal(tx, lead.customerId);
    });
    return fullLead(id);
  },

  async markLost(id: string, input: z.infer<typeof lostSchema>, actorId: string) {
    const lead = await loadLead(id);
    if (isTerminal(lead.status)) throw new AppError(409, "TERMINAL_LEAD", "This lead is already closed");
    await prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { status: LeadStatus.LOST } });
      await tx.lostDeal.create({ data: { leadId: id, reason: input.reason, competitor: input.competitor, remarks: input.remarks } });
      await tx.leadTimeline.create({ data: { leadId: id, fromStatus: lead.status, toStatus: LeadStatus.LOST, actorId, note: "Marked lost" } });
    });
    const info = await prisma.lead.findUnique({ where: { id }, select: { ownerId: true, customer: { select: { customerName: true, company: true } } } });
    await notify([info?.ownerId, ...(await adminIds())], "LEAD_LOST", `Deal lost with ${customerLabel(info?.customer)}: ${input.reason}`, actorId);
    return fullLead(id);
  },

  async getLost(id: string) {
    const lost = await prisma.lostDeal.findUnique({ where: { leadId: id } });
    if (!lost) throw AppError.notFound("This lead has no lost record");
    return lost;
  },

  async updateLost(id: string, input: z.infer<typeof lostUpdateSchema>) {
    await loadLead(id);
    const lost = await prisma.lostDeal.findUnique({ where: { leadId: id } });
    if (!lost) throw AppError.notFound("This lead has no lost record");
    return prisma.lostDeal.update({ where: { leadId: id }, data: input });
  },

  async listFollowUps(id: string) {
    await loadLead(id);
    return prisma.followUp.findMany({ where: { leadId: id }, orderBy: { dueAt: "asc" } });
  },

  async addFollowUp(id: string, input: z.infer<typeof followUpCreateSchema>) {
    const lead = await loadLead(id);
    if (!followUpAllowed(lead.status)) {
      throw new AppError(400, "FOLLOWUP_STAGE_INVALID", "Follow-ups are available from the Contacted stage");
    }
    return prisma.followUp.create({ data: { leadId: id, dueAt: input.dueAt, note: input.note } });
  },

  async updateFollowUp(id: string, followUpId: string, input: z.infer<typeof followUpUpdateSchema>) {
    await loadLead(id);
    const fu = await prisma.followUp.findFirst({ where: { id: followUpId, leadId: id } });
    if (!fu) throw AppError.notFound("Follow-up not found");
    return prisma.followUp.update({ where: { id: followUpId }, data: input });
  },

  async removeFollowUp(id: string, followUpId: string) {
    await loadLead(id);
    const fu = await prisma.followUp.findFirst({ where: { id: followUpId, leadId: id } });
    if (!fu) throw AppError.notFound("Follow-up not found");
    await prisma.followUp.delete({ where: { id: followUpId } });
    return { deleted: true };
  },
};

// Local type for quote metadata passed from the controller.
type QuoteMeta = { quoteNumber: string; quoteDate: Date; remarks?: string };
