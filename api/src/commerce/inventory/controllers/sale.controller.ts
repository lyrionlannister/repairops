import { Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SaleService } from "../services/sale.service.js";
import { CreateSaleDto } from "../dtos/create-sale.dto.js";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";

export class SaleController {
  constructor(private service: SaleService) {}

  getAll = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getAll());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sale = await this.service.getById(req.params["id"] as string);
      if (!sale) {
        res.status(404).json({ error: "Venta no encontrada" });
        return;
      }
      const [items, payments] = await Promise.all([
        this.service.getItems(sale.id),
        this.service.getPayments(sale.id),
      ]);
      res.status(200).json({ ...sale, items, payments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateSaleDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const sale = await this.service.create(dto, req.user!.role);
      res.status(201).json(sale);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
