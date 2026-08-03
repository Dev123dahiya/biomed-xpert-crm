import { z } from "zod";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/AppError";
import { roleBodySchema } from "./roles.schema";

export const rolesService = {
  async list() {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
    return roles.map((r) => ({ id: r.id, name: r.name, userCount: r._count.users }));
  },
  async create(input: z.infer<typeof roleBodySchema>) {
    const existing = await prisma.role.findUnique({ where: { name: input.name } });
    if (existing) throw new AppError(409, "ROLE_EXISTS", "A role with that name already exists");
    return prisma.role.create({ data: { name: input.name } });
  },
  async update(id: string, input: z.infer<typeof roleBodySchema>) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw AppError.notFound("Role not found");
    const clash = await prisma.role.findUnique({ where: { name: input.name } });
    if (clash && clash.id !== id) throw new AppError(409, "ROLE_EXISTS", "A role with that name already exists");
    return prisma.role.update({ where: { id }, data: { name: input.name } });
  },
  async remove(id: string) {
    const count = await prisma.user.count({ where: { roleId: id } });
    if (count > 0) throw new AppError(409, "ROLE_IN_USE", "Reassign users before deleting this role");
    await prisma.role.delete({ where: { id } });
    return { deleted: true };
  },
};
