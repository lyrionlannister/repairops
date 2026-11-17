import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RevenueAttributionService } from "../services/revenue-attribution.service.js";
import { SetAttributionBasisDto } from "../dtos/set-attribution-basis.dto.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class RevenueAttributionController {
  constructor(private service: RevenueAttributionService) {}

  getSetting = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getSetting());
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  updateSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(SetAttributionBasisDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(200).json(await this.service.setBasis(dto.attributionBasis));
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };
}
