import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { ok } from "../../common/httpResponse";
import { dashboardService } from "./dashboard.service";

const parseDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    ok(
      res,
      await dashboardService.overview(
        parseDate(req.query.from),
        parseDate(req.query.to),
        parseDate(req.query.compareFrom),
        parseDate(req.query.compareTo),
      ),
    );
  }),
);
