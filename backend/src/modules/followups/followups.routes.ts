import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { ok } from "../../common/httpResponse";
import { buildMeta, parsePage } from "../../common/pagination";

const querySchema = z.object({
  scope: z.enum(["overdue", "today", "week", "upcoming", "done", "all"]).default("all"),
  mine: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Agenda of follow-ups across every lead, grouped by when they are due.
export const followUpsRouter = Router();
followUpsRouter.use(authenticate);

followUpsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = querySchema.parse(req.query);
    const page = parsePage(q, 50, 200);
    const today = startOfDay(new Date());
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const weekEnd = new Date(today.getTime() + 7 * 86_400_000);

    const where: Prisma.FollowUpWhereInput = {};
    if (q.scope === "done") where.done = true;
    else if (q.scope !== "all") where.done = false;
    if (q.scope === "overdue") where.dueAt = { lt: today };
    if (q.scope === "today") where.dueAt = { gte: today, lt: tomorrow };
    if (q.scope === "week") where.dueAt = { gte: today, lt: weekEnd };
    if (q.scope === "upcoming") where.dueAt = { gte: tomorrow };
    if (q.mine === "true") where.lead = { ownerId: req.user!.id };

    const [rows, total, counts] = await Promise.all([
      prisma.followUp.findMany({
        where,
        orderBy: { dueAt: q.scope === "done" ? "desc" : "asc" },
        skip: page.skip,
        take: page.take,
        include: {
          lead: {
            select: {
              id: true,
              status: true,
              priority: true,
              approxValue: true,
              owner: { select: { id: true, name: true } },
              customer: { select: { id: true, customerName: true, company: true, phone: true, email: true, city: true } },
            },
          },
        },
      }),
      prisma.followUp.count({ where }),
      Promise.all([
        prisma.followUp.count({ where: { done: false, dueAt: { lt: today }, ...(q.mine === "true" ? { lead: { ownerId: req.user!.id } } : {}) } }),
        prisma.followUp.count({ where: { done: false, dueAt: { gte: today, lt: tomorrow }, ...(q.mine === "true" ? { lead: { ownerId: req.user!.id } } : {}) } }),
        prisma.followUp.count({ where: { done: false, dueAt: { gte: tomorrow }, ...(q.mine === "true" ? { lead: { ownerId: req.user!.id } } : {}) } }),
      ]),
    ]);

    ok(
      res,
      rows.map((f) => ({
        id: f.id,
        dueAt: f.dueAt,
        note: f.note,
        done: f.done,
        lead: { ...f.lead, approxValue: Number(f.lead.approxValue) },
      })),
      { ...buildMeta(page, total), counts: { overdue: counts[0], today: counts[1], upcoming: counts[2] } },
    );
  }),
);
