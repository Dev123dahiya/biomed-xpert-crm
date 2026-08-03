import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { authController } from "./auth.controller";
import { loginSchema, changePasswordSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
authRouter.patch("/password", authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));
