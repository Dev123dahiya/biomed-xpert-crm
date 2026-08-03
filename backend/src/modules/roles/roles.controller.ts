import { Request, Response } from "express";
import { created, ok } from "../../common/httpResponse";
import { rolesService } from "./roles.service";

export const rolesController = {
  async list(_req: Request, res: Response): Promise<void> { ok(res, await rolesService.list()); },
  async create(req: Request, res: Response): Promise<void> { created(res, await rolesService.create(req.body)); },
  async update(req: Request, res: Response): Promise<void> { ok(res, await rolesService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response): Promise<void> { ok(res, await rolesService.remove(req.params.id)); },
};
