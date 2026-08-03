import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const productsRepository = {
  findMany: (where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput, skip: number, take: number) =>
    prisma.product.findMany({ where, orderBy, skip, take }),
  count: (where: Prisma.ProductWhereInput) => prisma.product.count({ where }),
  findById: (id: string) => prisma.product.findUnique({ where: { id } }),
  findByTriple: (name: string, make: string, model: string) =>
    prisma.product.findUnique({ where: { name_make_model: { name, make, model } } }),
  create: (data: Prisma.ProductCreateInput) => prisma.product.create({ data }),
  update: (id: string, data: Prisma.ProductUpdateInput) => prisma.product.update({ where: { id }, data }),
  delete: (id: string) => prisma.product.delete({ where: { id } }),
  usageCount: (id: string) => prisma.leadProduct.count({ where: { productId: id } }),
  autocomplete: (q: string, take: number) =>
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { make: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      orderBy: { name: "asc" },
    }),
};
