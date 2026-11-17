import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { PriceListService } from "../services/price-list.service.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class PriceListController {
  constructor(private service: PriceListService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    console.log("[controller] getAll llamado, query:", req.query);
    try {
      const { q } = req.query;
      const items = q
        ? await this.service.search(String(q))
        : await this.service.getAll();
      res.status(200).json(items);
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const item = await this.service.update(id, req.body);
      if (!item) {
        res.status(404).json({ error: "Item no encontrado" });
        return;
      }
      res.status(200).json(item);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const deleted = await this.service.delete(id);
      if (!deleted) {
        res.status(404).json({ error: "Item no encontrado" });
        return;
      }
      res.status(200).json({ message: "Item eliminado" });
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };
}
