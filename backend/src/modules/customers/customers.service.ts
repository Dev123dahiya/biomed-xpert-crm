import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError } from "../../common/AppError";
import { PageParams, buildMeta, parseSort } from "../../common/pagination";
import { toNumber } from "../../utils/money";
import { customersRepository } from "./customers.repository";
import { createCustomerSchema, listCustomersSchema, updateCustomerSchema } from "./customers.schema";

type ListQuery = z.infer<typeof listCustomersSchema>;
const clean = (v?: string): string | undefined => (v === "" ? undefined : v);

const serialize = <T extends { balance: unknown; totalValue: unknown }>(c: T) => ({
  ...c,
  balance: toNumber(c.balance as never),
  totalValue: toNumber(c.totalValue as never),
});

export const customersService = {
  async list(query: ListQuery, page: PageParams) {
    const where: Prisma.CustomerWhereInput = {};
    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search, mode: "insensitive" } },
        { company: { contains: query.search, mode: "insensitive" } },
        { gstin: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { city: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.city) where.city = { equals: query.city, mode: "insensitive" };
    if (query.state) where.state = { equals: query.state, mode: "insensitive" };

    const orderBy = parseSort(query.sort, ["customerName", "totalValue", "balance", "createdAt"], { createdAt: "desc" });
    const [items, total] = await Promise.all([
      customersRepository.findMany(where, orderBy, page.skip, page.take),
      customersRepository.count(where),
    ]);
    return { items: items.map(serialize), meta: buildMeta(page, total) };
  },

  async get(id: string) {
    const customer = await customersRepository.findById(id);
    if (!customer) throw AppError.notFound("Customer not found");
    return serialize(customer);
  },

  async create(input: z.infer<typeof createCustomerSchema>) {
    const created = await customersRepository.create({
      customerName: input.customerName,
      contactPerson: clean(input.contactPerson),
      company: clean(input.company),
      gstin: clean(input.gstin),
      phone: clean(input.phone),
      email: clean(input.email),
      addressLine1: clean(input.addressLine1),
      addressLine2: clean(input.addressLine2),
      city: clean(input.city),
      state: clean(input.state),
      pinCode: clean(input.pinCode),
      country: clean(input.country) ?? "India",
      balance: input.balance ?? 0,
    });
    return serialize(created);
  },

  async update(id: string, input: z.infer<typeof updateCustomerSchema>) {
    await this.get(id);
    const data: Prisma.CustomerUpdateInput = {};
    for (const key of ["customerName", "contactPerson", "company", "gstin", "phone", "email", "addressLine1", "addressLine2", "city", "state", "pinCode", "country"] as const) {
      if (input[key] !== undefined) data[key] = clean(input[key]);
    }
    if (input.balance !== undefined) data.balance = input.balance;
    return serialize(await customersRepository.update(id, data));
  },

  async remove(id: string) {
    await this.get(id);
    if ((await customersRepository.leadCount(id)) > 0) {
      throw new AppError(409, "CUSTOMER_HAS_LEADS", "This customer still has leads");
    }
    await customersRepository.delete(id);
    return { deleted: true };
  },

  async timeline(id: string) {
    await this.get(id);
    const rows = await customersRepository.timeline(id);
    return rows.map((r) => ({
      leadId: r.id,
      status: r.status,
      approxValue: toNumber(r.approxValue),
      updatedAt: r.updatedAt,
      finalValue: r.wonDeal ? toNumber(r.wonDeal.finalValue) : null,
      closingDate: r.wonDeal?.closingDate ?? null,
      lostReason: r.lostDeal?.reason ?? null,
    }));
  },
};
