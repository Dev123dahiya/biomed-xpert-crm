import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../common/AppError";
import { logger } from "../config/logger";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound("Route not found", "ROUTE_NOT_FOUND"));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ success: false, error: { code: "CONFLICT", message: "A record with these values already exists" } });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found" } });
      return;
    }
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
};
