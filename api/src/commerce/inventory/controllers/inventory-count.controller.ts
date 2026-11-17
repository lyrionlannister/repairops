import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { InventoryCountService, InventoryCountCloseBlockedError } from "../services/inventory-count.service.js";
import { OpenInventoryCountDto } from "../dtos/open-inventory-count.dto.js";
import { SetCountedInventoryCountItemDto } from "../dtos/set-counted-inventory-count-item.dto.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class InventoryCountController {
  constructor(private service: InventoryCountService) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const count = await this.service.getById(req.params["id"] as string);
      if (!count) {
        res.status(404).json({ error: "Conteo no encontrado" });
        return;
      }
      const items = await this.service.getItems(count.id);
      res.status(200).json({ ...count, items });
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  open = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(OpenInventoryCountDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(201).json(await this.service.open(dto.branchId, dto.openedByEmployeeId));
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  setCounted = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(SetCountedInventoryCountItemDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const updated = await this.service.setCounted(req.params["itemId"] as string, dto.countedQuantity, dto.reason);
      res.status(200).json(updated);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  close = async (req: Request, res: Response): Promise<void> => {
    try {
      const closed = await this.service.close(req.params["id"] as string, req.body?.closedByEmployeeId);
      res.status(200).json(closed);
    } catch (error: any) {
      if (error instanceof InventoryCountCloseBlockedError) {
        res.status(400).json({ error: error.message, missingReasonItemIds: error.missingReasonItemIds });
        return;
      }
      sendError(res, error, 400);
    }
  };
}
