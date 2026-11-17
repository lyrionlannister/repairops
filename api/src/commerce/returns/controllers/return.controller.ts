import { singleton } from "tsyringe";
import { Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ReturnService } from "../services/return.service.js";
import { CreateReturnDto } from "../dtos/create-return.dto.js";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class ReturnController {
  constructor(private service: ReturnService) {}

  getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const theReturn = await this.service.getById(req.params["id"] as string);
      if (!theReturn) {
        res.status(404).json({ error: "Devolución no encontrada" });
        return;
      }
      const items = await this.service.getItems(theReturn.id);
      res.status(200).json({ ...theReturn, items });
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  getBySaleId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getBySaleId(req.params["saleId"] as string));
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateReturnDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const theReturn = await this.service.create(dto);
      res.status(201).json(theReturn);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };
}
