import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { leadSourcesController } from "./leadSources.controller";
import { sourceBodySchema } from "./leadSources.schema";

export const leadSourcesRouter = Router();
leadSourcesRouter.use(authenticate);
leadSourcesRouter.get("/", asyncHandler(leadSourcesController.list));
leadSourcesRouter.post("/", authorize("ADMIN"), validate(sourceBodySchema), asyncHandler(leadSourcesController.create));
leadSourcesRouter.patch("/:id", authorize("ADMIN"), validate(sourceBodySchema), asyncHandler(leadSourcesController.update));
leadSourcesRouter.delete("/:id", authorize("ADMIN"), asyncHandler(leadSourcesController.remove));
