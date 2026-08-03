import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError } from "../../common/AppError";
import { PageParams, buildMeta, parseSort } from "../../common/pagination";
import { toNumber } from "../../utils/money";
import { productsRepository } from "./products.repository";
import { createProductSchema, listProductsSchema, updateProductSchema } from "./products.schema";

type ListQuery = z.infer<typeof listProductsSchema>;
const serialize = <T extends { unitPrice: unknown }>(p: T) => ({ ...p, unitPrice: toNumber(p.unitPrice as never) });

export const productsService = {
  async list(query: ListQuery, page: PageParams) {
    const where: Prisma.ProductWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { make: { contains: query.search, mode: "insensitive" } },
        { model: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.category) where.category = { equals: query.category, mode: "insensitive" };
    const orderBy = parseSort(query.sort, ["name", "unitPrice", "createdAt"], { name: "asc" });
    const [items, total] = await Promise.all([
      productsRepository.findMany(where, orderBy, page.skip, page.take),
      productsRepository.count(where),
    ]);
    return { items: items.map(serialize), meta: buildMeta(page, total) };
  },

  async autocomplete(q: string) {
    const rows = await productsRepository.autocomplete(q, 10);
    return rows.map(serialize);
  },

  async get(id: string) {
    const product = await productsRepository.findById(id);
    if (!product) throw AppError.notFound("Product not found");
    return serialize(product);
  },

  async create(input: z.infer<typeof createProductSchema>) {
    const existing = await productsRepository.findByTriple(input.name, input.make, input.model);
    if (existing) throw new AppError(409, "PRODUCT_EXISTS", "That product already exists");
    return serialize(await productsRepository.create(input));
  },

  async update(id: string, input: z.infer<typeof updateProductSchema>) {
    const current = await productsRepository.findById(id);
    if (!current) throw AppError.notFound("Product not found");
    const name = input.name ?? current.name;
    const make = input.make ?? current.make;
    const model = input.model ?? current.model;
    const clash = await productsRepository.findByTriple(name, make, model);
    if (clash && clash.id !== id) throw new AppError(409, "PRODUCT_EXISTS", "That product already exists");
    return serialize(await productsRepository.update(id, input));
  },

  async remove(id: string) {
    await this.get(id);
    if ((await productsRepository.usageCount(id)) > 0) {
      throw new AppError(409, "PRODUCT_IN_USE", "This product is used by one or more leads");
    }
    await productsRepository.delete(id);
    return { deleted: true };
  },
};
