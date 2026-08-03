import { Request, Response } from "express";
import { created, ok } from "../../common/httpResponse";
import { parsePage } from "../../common/pagination";
import { productsService } from "./products.service";
import { listProductsSchema } from "./products.schema";

export const productsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listProductsSchema.parse(req.query);
    const { items, meta } = await productsService.list(query, parsePage(query));
    ok(res, items, meta);
  },
  async autocomplete(req: Request, res: Response): Promise<void> {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    ok(res, await productsService.autocomplete(q));
  },
  async create(req: Request, res: Response): Promise<void> { created(res, await productsService.create(req.body)); },
  async get(req: Request, res: Response): Promise<void> { ok(res, await productsService.get(req.params.id)); },
  async update(req: Request, res: Response): Promise<void> { ok(res, await productsService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response): Promise<void> { ok(res, await productsService.remove(req.params.id)); },
};
