import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { usersController } from "./users.controller";
import { createUserSchema, updateUserSchema } from "./users.schema";

export const usersRouter = Router();
usersRouter.use(authenticate, authorize("ADMIN"));

usersRouter.get("/", asyncHandler(usersController.list));
usersRouter.post("/", validate(createUserSchema), asyncHandler(usersController.create));
usersRouter.get("/:id", asyncHandler(usersController.get));
usersRouter.patch("/:id", validate(updateUserSchema), asyncHandler(usersController.update));
usersRouter.delete("/:id", asyncHandler(usersController.remove));
