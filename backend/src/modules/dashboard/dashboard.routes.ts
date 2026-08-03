import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { ok } from "../../common/httpResponse";
import { dashboardService } from "./dashboard.service";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    ok(res, await dashboardService.overview(from, to));
  }),
);
