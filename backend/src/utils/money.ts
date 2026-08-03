import { Prisma } from "@prisma/client";

// Convert a Prisma Decimal (or number/string) to a plain number for serialization.
export const toNumber = (value: Prisma.Decimal | number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
};
