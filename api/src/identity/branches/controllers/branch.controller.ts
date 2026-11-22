import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { BranchService } from "../services/branch.service.js";
import { BranchDiscountCapService } from "../services/branch-discount-cap.service.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class BranchController {
  constructor(
    private service: BranchService,
    private discountCapService: BranchDiscountCapService,
  ) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getAll());
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const branch = await this.service.getById(req.params["id"] as string);
      if (!branch) {
        res.status(404).json({ error: "Sucursal no encontrada" });
        return;
      }
      res.status(200).json(branch);
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const branch = await this.service.create(req.body);
      res.status(201).json(branch);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const branch = await this.service.update(id, req.body);
      if (!branch) {
        res.status(404).json({ error: "Sucursal no encontrada" });
        return;
      }
      res.status(200).json(branch);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  setActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const branch = await this.service.setActive(id, Boolean(req.body.isActive));
      if (!branch) {
        res.status(404).json({ error: "Sucursal no encontrada" });
        return;
      }
      res.status(200).json(branch);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  // Pasa primero por getById: el personal solo ve los topes de sus propias sucursales.
  getDiscountCaps = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const caps = (await this.service.getById(id)) ? await this.discountCapService.getForBranch(id) : null;
      if (!caps) {
        res.status(404).json({ error: "Sucursal no encontrada" });
        return;
      }
      res.status(200).json(caps);
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  replaceDiscountCaps = async (req: Request, res: Response): Promise<void> => {
    try {
      const caps = Array.isArray(req.body?.caps) ? req.body.caps : null;
      if (!caps) {
        res.status(400).json({ error: "caps debe ser una lista" });
        return;
      }
      const saved = await this.discountCapService.replaceForBranch(req.params["id"] as string, caps);
      if (!saved) {
        res.status(404).json({ error: "Sucursal no encontrada" });
        return;
      }
      res.status(200).json(saved);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };
}
