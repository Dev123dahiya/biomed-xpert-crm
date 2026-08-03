import { z } from "zod";

const base = {
  customerName: z.string().min(1),
  contactPerson: z.string().optional(),
  company: z.string().optional(),
  gstin: z.string().length(15, "GSTIN must be 15 characters").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits").optional().or(z.literal("")),
  country: z.string().optional(),
  balance: z.coerce.number().optional(),
};

export const createCustomerSchema = z.object(base);
export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const listCustomersSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  sort: z.string().optional(),
});
