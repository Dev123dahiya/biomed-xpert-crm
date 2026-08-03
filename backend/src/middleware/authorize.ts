import { NextFunction, Request, Response } from "express";
import { AppError } from "../common/AppError";

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw AppError.unauthorized();
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw AppError.forbidden();
    }
    next();
  };
