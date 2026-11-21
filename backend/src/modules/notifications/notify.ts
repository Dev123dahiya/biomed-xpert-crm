import { prisma } from "../../config/prisma";
import { logger } from "../../config/logger";

// Create in-app notifications. Never throws: a failed notification must not fail the action that caused it.
export const notify = async (userIds: (string | null | undefined)[], type: string, message: string, exceptUserId?: string): Promise<void> => {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id) && id !== exceptUserId))];
  if (ids.length === 0) return;
  try {
    await prisma.notification.createMany({ data: ids.map((userId) => ({ userId, type, message })) });
  } catch (err) {
    logger.warn({ err }, "Could not create notifications");
  }
};

export const adminIds = async (): Promise<string[]> => {
  const admins = await prisma.user.findMany({ where: { active: true, role: { name: "ADMIN" } }, select: { id: true } });
  return admins.map((a) => a.id);
};
