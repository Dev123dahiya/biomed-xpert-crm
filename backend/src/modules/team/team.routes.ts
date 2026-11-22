import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { ok } from "../../common/httpResponse";

// Read-only directory of active teammates, for owner pickers. Any signed-in user can read it.
export const teamRouter = Router();
teamRouter.use(authenticate);
teamRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
    });
    ok(res, users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role.name })));
  }),
);
