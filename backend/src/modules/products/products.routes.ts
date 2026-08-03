import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { productsController } from "./products.controller";
import { createProductSchema, updateProductSchema } from "./products.schema";

export const productsRouter = Router();
productsRouter.use(authenticate);
productsRouter.get("/", asyncHandler(productsController.list));
productsRouter.get("/autocomplete", asyncHandler(productsController.autocomplete));
productsRouter.post("/", validate(createProductSchema), asyncHandler(productsController.create));
productsRouter.get("/:id", asyncHandler(productsController.get));
productsRouter.patch("/:id", validate(updateProductSchema), asyncHandler(productsController.update));
productsRouter.delete("/:id", asyncHandler(productsController.remove));
