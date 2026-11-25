import { singleton } from "tsyringe";
import { readPageQuery } from "../../../core/common/utils/page-query.js";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { InventoryTransferService } from "../services/inventory-transfer.service.js";
import { CreateInventoryTransferDto } from "../dtos/create-inventory-transfer.dto.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class InventoryTransferController {
  constructor(private service: InventoryTransferService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = await readPageQuery(req.query);
      res.status(200).json(page ? await this.service.getPage(page) : await this.service.getAll());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateInventoryTransferDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(201).json(await this.service.create(dto));
    } catch (error) {
      sendError(res, error, 400);
    }
  };
}
