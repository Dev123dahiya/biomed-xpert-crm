import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { ok } from "../../common/httpResponse";
import { AppError } from "../../common/AppError";

export const searchRouter = Router();
searchRouter.use(authenticate);

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 1) throw AppError.badRequest("VALIDATION_ERROR", "Enter a search term");
    const like = { contains: q, mode: "insensitive" as const };
    const [customers, leads, products] = await Promise.all([
      prisma.customer.findMany({
        where: { OR: [{ customerName: like }, { company: like }, { gstin: like }, { phone: like }, { email: like }, { city: like }] },
        take: 8,
        orderBy: { updatedAt: "desc" },
        select: { id: true, customerName: true, company: true, city: true, phone: true },
      }),
      prisma.lead.findMany({
        where: { OR: [{ notes: like }, { customer: { OR: [{ customerName: like }, { company: like }, { phone: like }, { gstin: like }] } }] },
        take: 8,
        orderBy: { updatedAt: "desc" },
        select: { id: true, status: true, approxValue: true, customer: { select: { customerName: true, company: true } } },
      }),
      prisma.product.findMany({
        where: { OR: [{ name: like }, { make: like }, { model: like }, { category: like }] },
        take: 6,
        orderBy: { name: "asc" },
        select: { id: true, name: true, make: true, model: true, unitPrice: true },
      }),
    ]);
    ok(res, {
      customers,
      leads: leads.map((l) => ({
        id: l.id,
        status: l.status,
        approxValue: Number(l.approxValue),
        customer: l.customer.company ?? l.customer.customerName,
        contact: l.customer.customerName,
      })),
      products: products.map((p) => ({ ...p, unitPrice: Number(p.unitPrice) })),
    });
  }),
);
