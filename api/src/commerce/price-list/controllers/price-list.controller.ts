import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { PriceListService } from "../services/price-list.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { readPageQuery } from "../../../core/common/utils/page-query.js";

@singleton()
export class PriceListController {
  constructor(private service: PriceListService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = await readPageQuery(req.query);
      if (page) {
        const filters = {
          brand: queryString(req.query["brand"]) || undefined,
          supplierId: queryString(req.query["supplierId"]) || undefined,
          search: page.search,
        };
        res.status(200).json(await this.service.getPage(filters, page));
        return;
      }
      const q = queryString(req.query.q);
      const items = q
        ? await this.service.search(q)
        : await this.service.getAll();
      res.status(200).json(items);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getBrands = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getBrands());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.getById(req.params["id"] as string);
      if (!item) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const item = await this.service.update(id, req.body);
      if (!item) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const deleted = await this.service.delete(id);
      if (!deleted) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json({ message: "Producto eliminado" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
