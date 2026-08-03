import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export const usersRepository = {
  findMany: (where: Prisma.UserWhereInput, orderBy: Prisma.UserOrderByWithRelationInput, skip: number, take: number) =>
    prisma.user.findMany({ where, orderBy, skip, take, select: publicSelect }),
  count: (where: Prisma.UserWhereInput) => prisma.user.count({ where }),
  findById: (id: string) => prisma.user.findUnique({ where: { id }, select: publicSelect }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data, select: publicSelect }),
  update: (id: string, data: Prisma.UserUpdateInput) => prisma.user.update({ where: { id }, data, select: publicSelect }),
};
