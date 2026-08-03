import { PaginationMeta } from "./httpResponse";

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export const parsePage = (query: Record<string, unknown>, defaultSize = 25, maxSize = 100): PageParams => {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number(query.pageSize ?? defaultSize) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};

export const buildMeta = (page: PageParams, total: number): PaginationMeta => ({
  page: page.page,
  pageSize: page.pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
});

export const parseSort = (
  sort: unknown,
  allowed: string[],
  fallback: Record<string, "asc" | "desc">,
): Record<string, "asc" | "desc"> => {
  if (typeof sort !== "string" || sort.length === 0) return fallback;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  if (!allowed.includes(field)) return fallback;
  return { [field]: desc ? "desc" : "asc" };
};
