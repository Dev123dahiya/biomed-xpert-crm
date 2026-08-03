import { Request, Response } from "express";
import { env } from "../../config/env";
import { ok } from "../../common/httpResponse";
import { AppError } from "../../common/AppError";
import { verifyRefreshToken } from "../../utils/jwt";
import { authService } from "./auth.service";

const REFRESH_COOKIE = "bmx_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    ok(res, { user, accessToken });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!token) throw AppError.unauthorized("No refresh token");
    let sub: string;
    try {
      sub = verifyRefreshToken(token).sub;
    } catch {
      throw AppError.unauthorized("Refresh token is invalid or expired");
    }
    const accessToken = await authService.refresh(sub);
    ok(res, { accessToken });
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    ok(res, { loggedOut: true });
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.me(req.user!.id);
    ok(res, { user });
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    ok(res, { changed: true });
  },
};
