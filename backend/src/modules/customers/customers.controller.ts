import { Request, Response } from "express";
import { created, ok } from "../../common/httpResponse";
import { parsePage } from "../../common/pagination";
import { customersService } from "./customers.service";
import { listCustomersSchema } from "./customers.schema";

export const customersController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listCustomersSchema.parse(req.query);
    const { items, meta } = await customersService.list(query, parsePage(query));
    ok(res, items, meta);
  },
  async create(req: Request, res: Response): Promise<void> { created(res, await customersService.create(req.body)); },
  async get(req: Request, res: Response): Promise<void> { ok(res, await customersService.get(req.params.id)); },
  async update(req: Request, res: Response): Promise<void> { ok(res, await customersService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response): Promise<void> { ok(res, await customersService.remove(req.params.id)); },
  async importMany(req: Request, res: Response): Promise<void> { ok(res, await customersService.importMany(req.body.rows)); },
  async timeline(req: Request, res: Response): Promise<void> { ok(res, await customersService.timeline(req.params.id)); },
};
