import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BillingService } from "../services/billing.service.js";
import { AssignSubscriptionDto } from "../dtos/assign-subscription.dto.js";
import { sendError } from "../../../core/http/error-response.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";

@singleton()
export class BillingController {
  constructor(private service: BillingService) {}

  getPlan = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getCurrent());
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  listPlans = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.listPlans());
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  listTenants = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.listTenants());
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  assignSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(AssignSubscriptionDto, req.body ?? {});
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const summary = await this.service.assign(req.params["tenantId"] as string, dto);
      if (!summary) {
        res.status(404).json({ error: "Taller no encontrado" });
        return;
      }
      res.status(200).json(summary);
    } catch (error: any) {
      sendError(res, error, 400);
    }
  };
}
