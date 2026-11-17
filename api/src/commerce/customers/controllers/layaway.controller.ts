import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LayawayService } from "../services/layaway.service.js";
import { OpenLayawayDto } from "../dtos/open-layaway.dto.js";
import { CompleteLayawayDto } from "../dtos/complete-layaway.dto.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class LayawayController {
  constructor(private service: LayawayService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getAll());
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const layaway = await this.service.getById(req.params["id"] as string);
      if (!layaway) {
        res.status(404).json({ error: "Apartado no encontrado" });
        return;
      }
      const items = await this.service.getItems(layaway.id);
      res.status(200).json({ ...layaway, items });
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  open = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(OpenLayawayDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(201).json(await this.service.open(dto));
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CompleteLayawayDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const layaway = await this.service.complete(req.params["id"] as string, dto.payments, dto.cashSessionId);
      res.status(200).json(layaway);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    try {
      const layaway = await this.service.cancel(req.params["id"] as string);
      res.status(200).json(layaway);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };
}
