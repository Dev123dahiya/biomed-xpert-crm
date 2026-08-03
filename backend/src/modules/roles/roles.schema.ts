import { z } from "zod";
export const roleBodySchema = z.object({ name: z.string().min(1).transform((s) => s.trim()) });
