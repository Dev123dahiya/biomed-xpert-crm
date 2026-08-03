import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { rolesController } from "./roles.controller";
import { roleBodySchema } from "./roles.schema";

export const rolesRouter = Router();
rolesRouter.use(authenticate);
rolesRouter.get("/", asyncHandler(rolesController.list));
rolesRouter.post("/", authorize("ADMIN"), validate(roleBodySchema), asyncHandler(rolesController.create));
rolesRouter.patch("/:id", authorize("ADMIN"), validate(roleBodySchema), asyncHandler(rolesController.update));
rolesRouter.delete("/:id", authorize("ADMIN"), asyncHandler(rolesController.remove));
