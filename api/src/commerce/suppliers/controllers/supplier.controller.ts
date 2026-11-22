import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { bodyOf } from "../../../core/http/request-body.js";
import { SupplierService } from "../services/supplier.service.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class SupplierController {
  constructor(private service: SupplierService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const suppliers = await this.service.getAll();
      res.status(200).json(suppliers);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const supplier = await this.service.getById(id);
      if (!supplier) {
        res.status(404).json({ error: "Proveedor no encontrado" });
        return;
      }
      res.status(200).json(supplier);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const supplier = await this.service.create(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const supplier = await this.service.update(id, req.body);
      if (!supplier) {
        res.status(404).json({ error: "Proveedor no encontrado" });
        return;
      }
      res.status(200).json(supplier);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const deleted = await this.service.delete(id);
      if (!deleted) {
        res.status(404).json({ error: "Proveedor no encontrado" });
        return;
      }
      res.status(200).json({ message: "Proveedor eliminado" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  setActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const supplier = await this.service.setActive(id, Boolean(bodyOf(req).isActive));
      if (!supplier) {
        res.status(404).json({ error: "Proveedor no encontrado" });
        return;
      }
      res.status(200).json(supplier);
    } catch (error) {
      sendError(res, error, 400);
    }
  };
}
