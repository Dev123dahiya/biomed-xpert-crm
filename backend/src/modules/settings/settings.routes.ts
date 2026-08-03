import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { ok } from "../../common/httpResponse";

const patchSchema = z
  .object({
    currency: z.string().min(1).optional(),
    orgName: z.string().min(1).optional(),
    listPageSize: z.coerce.number().int().positive().optional(),
    maxProductsPerLead: z.coerce.number().int().positive().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one setting" });

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.setting.findMany();
    ok(res, Object.fromEntries(rows.map((r) => [r.key, r.value])));
  }),
);

settingsRouter.patch(
  "/",
  authorize("ADMIN"),
  validate(patchSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, string | number>;
    await prisma.$transaction(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }),
      ),
    );
    const rows = await prisma.setting.findMany();
    ok(res, Object.fromEntries(rows.map((r) => [r.key, r.value])));
  }),
);
