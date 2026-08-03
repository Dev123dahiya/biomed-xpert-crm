import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { ok } from "../../common/httpResponse";
import { AppError } from "../../common/AppError";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = { userId: req.user!.id, ...(req.query.read ? { read: req.query.read === "true" } : {}) };
    ok(res, await prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }));
  }),
);

notificationsRouter.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    ok(res, { updated: true });
  }),
);

notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!n) throw AppError.notFound("Notification not found");
    ok(res, await prisma.notification.update({ where: { id: n.id }, data: { read: true } }));
  }),
);
