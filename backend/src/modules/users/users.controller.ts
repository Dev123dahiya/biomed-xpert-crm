import { Request, Response } from "express";
import { created, ok } from "../../common/httpResponse";
import { parsePage } from "../../common/pagination";
import { usersService } from "./users.service";
import { listUsersSchema } from "./users.schema";

export const usersController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listUsersSchema.parse(req.query);
    const { items, meta } = await usersService.list(query, parsePage(query));
    ok(res, items, meta);
  },
  async create(req: Request, res: Response): Promise<void> {
    created(res, await usersService.create(req.body));
  },
  async get(req: Request, res: Response): Promise<void> {
    ok(res, await usersService.get(req.params.id));
  },
  async update(req: Request, res: Response): Promise<void> {
    ok(res, await usersService.update(req.params.id, req.body));
  },
  async remove(req: Request, res: Response): Promise<void> {
    ok(res, { deactivated: true, user: await usersService.deactivate(req.params.id, req.user!.id) });
  },
};
