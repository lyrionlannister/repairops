import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { WhatsappAccountService } from "../services/whatsapp-account.service.js";
import { WhatsappTemplateService } from "../services/whatsapp-template.service.js";
import { ConnectWhatsappAccountDto } from "../dtos/connect-whatsapp-account.dto.js";
import { WhatsappGraphApiError } from "../clients/whatsapp-graph.client.js";
import { flattenValidationErrors as validationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class WhatsappAccountController {
  constructor(
    private whatsappAccountService: WhatsappAccountService,
    private whatsappTemplateService: WhatsappTemplateService,
  ) {}

  getStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const account = await this.whatsappAccountService.getOrCreateForTenant();
      res.status(200).json({
        status: account.status,
        phoneNumberId: account.phoneNumberId,
        ownedByPlatform: account.ownedByPlatform,
      });
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };

  connectAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(ConnectWhatsappAccountDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const account = await this.whatsappAccountService.connectOwnAccount(dto);
      res.status(200).json({
        status: account.status,
        phoneNumberId: account.phoneNumberId,
        ownedByPlatform: account.ownedByPlatform,
      });
    } catch (error: any) {
      if (error instanceof WhatsappGraphApiError) {
        sendError(res, error, 400);
        return;
      }
      sendError(res, error, 500);
    }
  };

  getTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const account = await this.whatsappAccountService.getOrCreateForTenant();
      const templates = await this.whatsappTemplateService.reconcile(account);
      res.status(200).json(templates);
    } catch (error: any) {
      sendError(res, error, 500);
    }
  };
}
