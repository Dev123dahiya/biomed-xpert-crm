import { Request, Response } from "express";
import { LeadStatus } from "@prisma/client";
import { created, ok } from "../../common/httpResponse";
import { parsePage } from "../../common/pagination";
import { leadsService } from "./leads.service";
import { listLeadsSchema } from "./leads.schema";

export const leadsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listLeadsSchema.parse(req.query);
    const { items, meta } = await leadsService.list(query, parsePage(query));
    ok(res, items, meta);
  },
  async board(req: Request, res: Response): Promise<void> {
    const query = listLeadsSchema.parse(req.query);
    ok(res, await leadsService.board(query));
  },
  async create(req: Request, res: Response): Promise<void> {
    created(res, await leadsService.create(req.body, req.user!.id));
  },
  async get(req: Request, res: Response): Promise<void> { ok(res, await leadsService.get(req.params.id)); },
  async update(req: Request, res: Response): Promise<void> { ok(res, await leadsService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response): Promise<void> { ok(res, await leadsService.remove(req.params.id)); },
  async changeStatus(req: Request, res: Response): Promise<void> {
    ok(res, await leadsService.changeStatus(req.params.id, req.body.toStatus as LeadStatus, req.body.note, req.user!.id));
  },
  async timeline(req: Request, res: Response): Promise<void> { ok(res, await leadsService.timeline(req.params.id)); },

  async replaceProducts(req: Request, res: Response): Promise<void> { ok(res, await leadsService.replaceProducts(req.params.id, req.body)); },
  async addProduct(req: Request, res: Response): Promise<void> { created(res, await leadsService.addProduct(req.params.id, req.body)); },
  async removeProduct(req: Request, res: Response): Promise<void> { ok(res, await leadsService.removeProduct(req.params.id, req.params.lineId)); },

  async listQuotes(req: Request, res: Response): Promise<void> { ok(res, await leadsService.listQuotes(req.params.id)); },
  async addQuote(req: Request, res: Response): Promise<void> {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    created(res, await leadsService.addQuote(req.params.id, req.body, fileUrl));
  },
  async removeQuote(req: Request, res: Response): Promise<void> { ok(res, await leadsService.removeQuote(req.params.id, req.params.quoteId)); },

  async markWon(req: Request, res: Response): Promise<void> { created(res, await leadsService.markWon(req.params.id, req.body, req.user!.id)); },
  async getWon(req: Request, res: Response): Promise<void> { ok(res, await leadsService.getWon(req.params.id)); },
  async updateWon(req: Request, res: Response): Promise<void> { ok(res, await leadsService.updateWon(req.params.id, req.body)); },

  async markLost(req: Request, res: Response): Promise<void> { created(res, await leadsService.markLost(req.params.id, req.body, req.user!.id)); },
  async getLost(req: Request, res: Response): Promise<void> { ok(res, await leadsService.getLost(req.params.id)); },
  async updateLost(req: Request, res: Response): Promise<void> { ok(res, await leadsService.updateLost(req.params.id, req.body)); },

  async listFollowUps(req: Request, res: Response): Promise<void> { ok(res, await leadsService.listFollowUps(req.params.id)); },
  async addFollowUp(req: Request, res: Response): Promise<void> { created(res, await leadsService.addFollowUp(req.params.id, req.body)); },
  async updateFollowUp(req: Request, res: Response): Promise<void> { ok(res, await leadsService.updateFollowUp(req.params.id, req.params.followUpId, req.body)); },
  async removeFollowUp(req: Request, res: Response): Promise<void> { ok(res, await leadsService.removeFollowUp(req.params.id, req.params.followUpId)); },
};
