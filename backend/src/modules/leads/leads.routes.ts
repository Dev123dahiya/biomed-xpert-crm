import { NextFunction, Request, Response, Router } from "express";
import { MulterError } from "multer";
import { asyncHandler } from "../../common/asyncHandler";
import { AppError } from "../../common/AppError";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { leadsController } from "./leads.controller";
import { quoteUpload } from "./leads.upload";
import {
  addProductSchema,
  createLeadSchema,
  followUpCreateSchema,
  followUpUpdateSchema,
  lostSchema,
  lostUpdateSchema,
  quoteMetaSchema,
  replaceProductsSchema,
  statusSchema,
  updateLeadSchema,
  wonSchema,
  wonUpdateSchema,
} from "./leads.schema";

export const leadsRouter = Router();
leadsRouter.use(authenticate);

leadsRouter.get("/", asyncHandler(leadsController.list));
leadsRouter.get("/board", asyncHandler(leadsController.board));
leadsRouter.post("/", validate(createLeadSchema), asyncHandler(leadsController.create));
leadsRouter.get("/:id", asyncHandler(leadsController.get));
leadsRouter.patch("/:id", validate(updateLeadSchema), asyncHandler(leadsController.update));
leadsRouter.delete("/:id", asyncHandler(leadsController.remove));

leadsRouter.patch("/:id/status", validate(statusSchema), asyncHandler(leadsController.changeStatus));
leadsRouter.get("/:id/timeline", asyncHandler(leadsController.timeline));

leadsRouter.put("/:id/products", validate(replaceProductsSchema), asyncHandler(leadsController.replaceProducts));
leadsRouter.post("/:id/products", validate(addProductSchema), asyncHandler(leadsController.addProduct));
leadsRouter.delete("/:id/products/:lineId", asyncHandler(leadsController.removeProduct));

const uploadQuote = (req: Request, res: Response, next: NextFunction): void => {
  quoteUpload(req, res, (err: unknown) => {
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      next(new AppError(413, "FILE_TOO_LARGE", "The file is larger than the allowed size"));
      return;
    }
    if (err) { next(err); return; }
    next();
  });
};

leadsRouter.get("/:id/quotes", asyncHandler(leadsController.listQuotes));
leadsRouter.post("/:id/quotes", uploadQuote, validate(quoteMetaSchema), asyncHandler(leadsController.addQuote));
leadsRouter.delete("/:id/quotes/:quoteId", asyncHandler(leadsController.removeQuote));

leadsRouter.post("/:id/won", validate(wonSchema), asyncHandler(leadsController.markWon));
leadsRouter.get("/:id/won", asyncHandler(leadsController.getWon));
leadsRouter.patch("/:id/won", validate(wonUpdateSchema), asyncHandler(leadsController.updateWon));

leadsRouter.post("/:id/lost", validate(lostSchema), asyncHandler(leadsController.markLost));
leadsRouter.get("/:id/lost", asyncHandler(leadsController.getLost));
leadsRouter.patch("/:id/lost", validate(lostUpdateSchema), asyncHandler(leadsController.updateLost));

leadsRouter.get("/:id/followups", asyncHandler(leadsController.listFollowUps));
leadsRouter.post("/:id/followups", validate(followUpCreateSchema), asyncHandler(leadsController.addFollowUp));
leadsRouter.patch("/:id/followups/:followUpId", validate(followUpUpdateSchema), asyncHandler(leadsController.updateFollowUp));
leadsRouter.delete("/:id/followups/:followUpId", asyncHandler(leadsController.removeFollowUp));
