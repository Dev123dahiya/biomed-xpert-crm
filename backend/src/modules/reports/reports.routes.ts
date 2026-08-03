import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { authenticate } from "../../middleware/authenticate";
import { reportsController } from "./reports.controller";

export const reportsRouter = Router();
reportsRouter.use(authenticate);

reportsRouter.get("/customers", asyncHandler(reportsController.customers));
reportsRouter.get("/leads", asyncHandler(reportsController.leads));
reportsRouter.get("/revenue", asyncHandler(reportsController.revenue));
reportsRouter.get("/sales", asyncHandler(reportsController.sales));
reportsRouter.get("/monthly", asyncHandler(reportsController.monthly));

// Excel-first targeted extraction
export const exportRouter = Router();
exportRouter.use(authenticate);
exportRouter.get("/customers/:id", asyncHandler(reportsController.exportCustomer));
exportRouter.get("/leads/:id", asyncHandler(reportsController.exportLead));
exportRouter.get("/leads", asyncHandler(reportsController.exportLeadsByStage));
