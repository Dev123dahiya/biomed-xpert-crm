import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const customersRepository = {
  findMany: (where: Prisma.CustomerWhereInput, orderBy: Prisma.CustomerOrderByWithRelationInput, skip: number, take: number) =>
    prisma.customer.findMany({ where, orderBy, skip, take }),
  count: (where: Prisma.CustomerWhereInput) => prisma.customer.count({ where }),
  findById: (id: string) => prisma.customer.findUnique({ where: { id } }),
  create: (data: Prisma.CustomerCreateInput) => prisma.customer.create({ data }),
  update: (id: string, data: Prisma.CustomerUpdateInput) => prisma.customer.update({ where: { id }, data }),
  delete: (id: string) => prisma.customer.delete({ where: { id } }),
  leadCount: (id: string) => prisma.lead.count({ where: { customerId: id } }),
  timeline: (id: string) =>
    prisma.lead.findMany({
      where: { customerId: id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        approxValue: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        source: { select: { name: true } },
        owner: { select: { name: true } },
        _count: { select: { products: true } },
        followUps: { where: { done: false }, orderBy: { dueAt: "asc" }, take: 1, select: { dueAt: true } },
        wonDeal: { select: { finalValue: true, closingDate: true } },
        lostDeal: { select: { reason: true } },
      },
    }),
};
