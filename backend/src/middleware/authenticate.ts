import { NextFunction, Request, Response } from "express";
import { AppError } from "../common/AppError";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw AppError.unauthorized();
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
    next();
  } catch {
    throw AppError.unauthorized("Access token is invalid or expired");
  }
};
