import { Router } from "express";
import { prisma } from "../../config/prisma";
import { ok } from "../../common/httpResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { productsController } from "./products.controller";
import { createProductSchema, updateProductSchema } from "./products.schema";

export const productsRouter = Router();
productsRouter.use(authenticate);
productsRouter.get("/", asyncHandler(productsController.list));
productsRouter.get("/autocomplete", asyncHandler(productsController.autocomplete));
productsRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.product.groupBy({ by: ["category"], _count: { _all: true }, orderBy: { category: "asc" } });
    ok(res, rows.filter((r) => r.category).map((r) => ({ name: r.category as string, count: r._count._all })));
  }),
);
productsRouter.post("/", validate(createProductSchema), asyncHandler(productsController.create));
productsRouter.get("/:id", asyncHandler(productsController.get));
productsRouter.patch("/:id", validate(updateProductSchema), asyncHandler(productsController.update));
productsRouter.delete("/:id", asyncHandler(productsController.remove));
