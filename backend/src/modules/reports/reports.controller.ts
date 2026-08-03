import { Request, Response } from "express";
import { LeadStatus } from "@prisma/client";
import { reportsData } from "./reports.data";
import { exportTable } from "./reports.exporters";
import { ExportFormat } from "./reports.types";

const ALLOWED: ExportFormat[] = ["json", "xlsx", "csv", "pdf"];
const fmt = (req: Request, fallback: ExportFormat): ExportFormat => {
  const f = String(req.query.format ?? fallback).toLowerCase();
  return (ALLOWED.includes(f as ExportFormat) ? f : fallback) as ExportFormat;
};
const parseDate = (v: unknown): Date | undefined => (v ? new Date(String(v)) : undefined);
const dateFilter = (req: Request) => ({ from: parseDate(req.query.from), to: parseDate(req.query.to) });

export const reportsController = {
  async customers(req: Request, res: Response): Promise<void> {
    const table = await reportsData.customers({ ...dateFilter(req), city: req.query.city as string, state: req.query.state as string });
    await exportTable(res, table, fmt(req, "json"));
  },
  async leads(req: Request, res: Response): Promise<void> {
    const table = await reportsData.leads({ ...dateFilter(req), status: req.query.status as LeadStatus, sourceId: req.query.sourceId as string, ownerId: req.query.ownerId as string });
    await exportTable(res, table, fmt(req, "json"));
  },
  async revenue(req: Request, res: Response): Promise<void> {
    const groupBy = req.query.groupBy === "customer" ? "customer" : "month";
    const table = await reportsData.revenue({ ...dateFilter(req), groupBy });
    await exportTable(res, table, fmt(req, "json"));
  },
  async sales(req: Request, res: Response): Promise<void> {
    const table = await reportsData.sales({ ...dateFilter(req), ownerId: req.query.ownerId as string });
    await exportTable(res, table, fmt(req, "json"));
  },
  async monthly(req: Request, res: Response): Promise<void> {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const table = await reportsData.monthly(year);
    await exportTable(res, table, fmt(req, "json"));
  },
  async exportCustomer(req: Request, res: Response): Promise<void> {
    const table = await reportsData.customerDetail(req.params.id);
    await exportTable(res, table, fmt(req, "xlsx"));
  },
  async exportLead(req: Request, res: Response): Promise<void> {
    const table = await reportsData.leadDetail(req.params.id);
    await exportTable(res, table, fmt(req, "xlsx"));
  },
  async exportLeadsByStage(req: Request, res: Response): Promise<void> {
    const stage = req.query.stage as LeadStatus | undefined;
    const table = await reportsData.leadsByStage(stage, { ...dateFilter(req), sourceId: req.query.sourceId as string, ownerId: req.query.ownerId as string });
    await exportTable(res, table, fmt(req, "xlsx"));
  },
};
