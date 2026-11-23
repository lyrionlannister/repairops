import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { LocalService, LocalValidationError } from "../services/local.service.js";
import { sendError } from "../../../core/http/error-response.js";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateLocalDto } from "../dtos/update-local.dto.js";
import { flattenValidationErrors as validationErrors } from "../../../core/common/utils/validation-errors.js";

@singleton()
export class LocalController {
  constructor(private localService: LocalService) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    try {
      const config = await this.localService.getConfigWithPalette();
      res.status(200).json(config);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(UpdateLocalDto, req.body);
      const errors = await validate(dto, { whitelist: true });
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const config = await this.localService.updateConfig(dto);
      res.status(200).json(config);
    } catch (error) {
      sendError(res, error, error instanceof LocalValidationError ? 400 : 500);
    }
  };
}
