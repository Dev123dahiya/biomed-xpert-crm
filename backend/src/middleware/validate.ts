import { NextFunction, Request, Response } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { AppError } from "../common/AppError";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodTypeAny, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const error = result.error as ZodError;
      const details = error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      throw AppError.badRequest("VALIDATION_ERROR", "Some fields need attention", details);
    }
    // Replace with parsed + coerced values.
    if (source === "body") req.body = result.data;
    else if (source === "params") Object.assign(req.params, result.data);
    else (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };
