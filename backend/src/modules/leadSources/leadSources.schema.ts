import { z } from "zod";
export const sourceBodySchema = z.object({ name: z.string().min(1).transform((s) => s.trim()) });
