import { Response } from "express";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const ok = <T>(res: Response, data: T, meta?: unknown): Response =>
  res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });

export const created = <T>(res: Response, data: T): Response =>
  res.status(201).json({ success: true, data });
