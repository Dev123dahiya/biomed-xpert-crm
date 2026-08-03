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
    const [customers, leads] = await Promise.all([
      prisma.customer.findMany({
        where: { OR: [{ customerName: like }, { company: like }, { gstin: like }, { phone: like }, { email: like }] },
        take: 10,
        select: { id: true, customerName: true, company: true },
      }),
      prisma.lead.findMany({
        where: { customer: { OR: [{ customerName: like }, { company: like }] } },
        take: 10,
        select: { id: true, status: true, customer: { select: { customerName: true } } },
      }),
    ]);
    ok(res, {
      customers,
      leads: leads.map((l) => ({ id: l.id, status: l.status, customer: l.customer.customerName })),
    });
  }),
);
