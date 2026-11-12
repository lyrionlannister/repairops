import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { WhatsappAccountService } from "../services/whatsapp-account.service.js";
import { WhatsappTemplateService } from "../services/whatsapp-template.service.js";

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
      res.status(500).json({ error: error.message });
    }
  };

  getTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const account = await this.whatsappAccountService.getOrCreateForTenant();
      const templates = await this.whatsappTemplateService.reconcile(account);
      res.status(200).json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
