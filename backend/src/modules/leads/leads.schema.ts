import { LeadStatus, Priority } from "@prisma/client";
import { z } from "zod";

const productLine = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  price: z.coerce.number().min(0).optional(),
});

export const createLeadSchema = z.object({
  customerId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceOther: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  approxValue: z.coerce.number().min(0).default(0),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  notes: z.string().optional(),
  ownerId: z.string().min(1).optional(),
  products: z.array(productLine).max(15).default([]),
  followUp: z.object({ dueAt: z.coerce.date(), note: z.string().optional() }).optional(),
});

export const updateLeadSchema = z
  .object({
    sourceId: z.string().min(1).optional(),
    sourceOther: z.string().optional(),
    approxValue: z.coerce.number().min(0).optional(),
    priority: z.nativeEnum(Priority).optional(),
    notes: z.string().optional(),
    ownerId: z.string().min(1).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const statusSchema = z.object({
  toStatus: z.enum([LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.QUOTE_SHARED]),
  note: z.string().optional(),
});

export const replaceProductsSchema = z.object({ products: z.array(productLine).max(15) });
export const addProductSchema = productLine;

export const quoteMetaSchema = z.object({
  quoteNumber: z.string().min(1),
  quoteDate: z.coerce.date(),
  remarks: z.string().optional(),
});

const wonProduct = z.object({
  name: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  amount: z.coerce.number().min(0).default(0),
});

export const wonSchema = z.object({
  finalValue: z.coerce.number().positive("Final value must be greater than zero"),
  invoiceNumber: z.string().optional(),
  closingDate: z.coerce.date().optional(),
  products: z.array(wonProduct).optional(),
});

export const wonUpdateSchema = z
  .object({
    finalValue: z.coerce.number().positive().optional(),
    invoiceNumber: z.string().optional(),
    closingDate: z.coerce.date().optional(),
    products: z.array(wonProduct).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const lostSchema = z.object({
  reason: z.string().min(1, "Lost reason is required"),
  competitor: z.string().optional(),
  remarks: z.string().optional(),
});

export const lostUpdateSchema = z
  .object({
    reason: z.string().min(1).optional(),
    competitor: z.string().optional(),
    remarks: z.string().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const followUpCreateSchema = z.object({ dueAt: z.coerce.date(), note: z.string().optional() });
export const followUpUpdateSchema = z
  .object({ dueAt: z.coerce.date().optional(), note: z.string().optional(), done: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const listLeadsSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  customerId: z.string().optional(),
  ownerId: z.string().optional(),
  sourceId: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  search: z.string().optional(),
  stage: z.enum(["open", "closed"]).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  sort: z.string().optional(),
});
