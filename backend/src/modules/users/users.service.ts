import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/AppError";
import { PageParams, buildMeta, parseSort } from "../../common/pagination";
import { hashPassword } from "../../utils/password";
import { usersRepository } from "./users.repository";
import { createUserSchema, listUsersSchema, updateUserSchema } from "./users.schema";

type ListQuery = z.infer<typeof listUsersSchema>;

const ensureRole = async (roleId: string): Promise<void> => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "That role does not exist");
};

export const usersService = {
  async list(query: ListQuery, page: PageParams) {
    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.roleId) where.roleId = query.roleId;
    if (query.active) where.active = query.active === "true";

    const orderBy = parseSort(query.sort, ["name", "email", "createdAt"], { createdAt: "desc" });
    const [items, total] = await Promise.all([
      usersRepository.findMany(where, orderBy, page.skip, page.take),
      usersRepository.count(where),
    ]);
    return { items, meta: buildMeta(page, total) };
  },

  async create(input: z.infer<typeof createUserSchema>) {
    await ensureRole(input.roleId);
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new AppError(409, "EMAIL_TAKEN", "That email is already in use");
    return usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      active: input.active ?? true,
      role: { connect: { id: input.roleId } },
    });
  },

  async get(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw AppError.notFound("User not found");
    return user;
  },

  async update(id: string, input: z.infer<typeof updateUserSchema>) {
    await this.get(id);
    if (input.roleId) await ensureRole(input.roleId);
    if (input.email) {
      const existing = await usersRepository.findByEmail(input.email);
      if (existing && existing.id !== id) throw new AppError(409, "EMAIL_TAKEN", "That email is already in use");
    }
    const data: Prisma.UserUpdateInput = {};
    if (input.name) data.name = input.name;
    if (input.email) data.email = input.email;
    if (input.active !== undefined) data.active = input.active;
    if (input.roleId) data.role = { connect: { id: input.roleId } };
    if (input.password) data.passwordHash = await hashPassword(input.password);
    return usersRepository.update(id, data);
  },

  async deactivate(id: string, actingUserId: string) {
    if (id === actingUserId) throw new AppError(409, "CANNOT_DELETE_SELF", "You cannot deactivate your own account");
    await this.get(id);
    return usersRepository.update(id, { active: false });
  },
};
