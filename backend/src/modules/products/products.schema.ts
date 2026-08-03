import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    unitPrice: z.coerce.number().min(0).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const listProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  sort: z.string().optional(),
});
