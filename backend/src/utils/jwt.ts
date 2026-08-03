import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser } from "../common/types";

export interface AccessPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export const signAccessToken = (user: AuthUser): string => {
  const payload: AccessPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessTtl } as SignOptions);
};

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshTtl } as SignOptions);

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, env.jwt.accessSecret) as AccessPayload;

export const verifyRefreshToken = (token: string): { sub: string } =>
  jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
