import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().min(1),
  active: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    roleId: z.string().min(1).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const listUsersSchema = z.object({
  search: z.string().optional(),
  roleId: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  sort: z.string().optional(),
});
