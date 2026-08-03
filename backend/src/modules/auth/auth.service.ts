import { prisma } from "../../config/prisma";
import { AppError } from "../../common/AppError";
import { AuthUser } from "../../common/types";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { LoginInput } from "./auth.schema";

const toAuthUser = (u: { id: string; email: string; name: string; role: { name: string } }): AuthUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role.name,
});

export const authService = {
  async login(input: LoginInput): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } });
    if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    if (!user.active) throw new AppError(403, "USER_INACTIVE", "This account has been deactivated");

    const authUser = toAuthUser(user);
    return { user: authUser, accessToken: signAccessToken(authUser), refreshToken: signRefreshToken(user.id) };
  },

  async refresh(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user || !user.active) throw AppError.unauthorized("Session is no longer valid");
    return signAccessToken(toAuthUser(user));
  },

  async me(userId: string): Promise<AuthUser & { active: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw AppError.unauthorized();
    return { ...toAuthUser(user), active: user.active };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.unauthorized();
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(400, "INVALID_PASSWORD", "Your current password is incorrect");
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  },
};
