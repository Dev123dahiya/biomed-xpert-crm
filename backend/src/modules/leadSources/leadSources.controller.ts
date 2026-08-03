import { Request, Response } from "express";
import { created, ok } from "../../common/httpResponse";
import { leadSourcesService } from "./leadSources.service";

export const leadSourcesController = {
  async list(_req: Request, res: Response): Promise<void> { ok(res, await leadSourcesService.list()); },
  async create(req: Request, res: Response): Promise<void> { created(res, await leadSourcesService.create(req.body)); },
  async update(req: Request, res: Response): Promise<void> { ok(res, await leadSourcesService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response): Promise<void> { ok(res, await leadSourcesService.remove(req.params.id)); },
};
