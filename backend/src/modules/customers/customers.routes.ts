import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { customersController } from "./customers.controller";
import { createCustomerSchema, importCustomersSchema, updateCustomerSchema } from "./customers.schema";

export const customersRouter = Router();
customersRouter.use(authenticate);
customersRouter.get("/", asyncHandler(customersController.list));
customersRouter.post("/", validate(createCustomerSchema), asyncHandler(customersController.create));
customersRouter.post("/import", validate(importCustomersSchema), asyncHandler(customersController.importMany));
customersRouter.get("/:id", asyncHandler(customersController.get));
customersRouter.patch("/:id", validate(updateCustomerSchema), asyncHandler(customersController.update));
customersRouter.delete("/:id", asyncHandler(customersController.remove));
customersRouter.get("/:id/timeline", asyncHandler(customersController.timeline));
