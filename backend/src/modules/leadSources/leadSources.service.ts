import { z } from "zod";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/AppError";
import { sourceBodySchema } from "./leadSources.schema";

export const leadSourcesService = {
  list: () => prisma.leadSource.findMany({ orderBy: { name: "asc" } }),
  async create(input: z.infer<typeof sourceBodySchema>) {
    const existing = await prisma.leadSource.findUnique({ where: { name: input.name } });
    if (existing) throw new AppError(409, "SOURCE_EXISTS", "That lead source already exists");
    return prisma.leadSource.create({ data: { name: input.name } });
  },
  async update(id: string, input: z.infer<typeof sourceBodySchema>) {
    const source = await prisma.leadSource.findUnique({ where: { id } });
    if (!source) throw AppError.notFound("Lead source not found");
    const clash = await prisma.leadSource.findUnique({ where: { name: input.name } });
    if (clash && clash.id !== id) throw new AppError(409, "SOURCE_EXISTS", "That lead source already exists");
    return prisma.leadSource.update({ where: { id }, data: { name: input.name } });
  },
  async remove(id: string) {
    const count = await prisma.lead.count({ where: { sourceId: id } });
    if (count > 0) throw new AppError(409, "SOURCE_IN_USE", "Leads still use this source");
    await prisma.leadSource.delete({ where: { id } });
    return { deleted: true };
  },
};
