import { singleton } from "tsyringe";
import type { Request, Response } from "express";
import { bodyOf } from "../../../core/http/request-body.js";
import { settingsService } from "../../../identity/settings/settings.service.js";
import { parseAbsoluteUrl } from "../../../core/common/utils/absolute-url.js";
import { sendError } from "../../../core/http/error-response.js";
import { AUTOMATION_ALLOWED_DOMAINS, isAllowedAutomationDomain } from "../utils/allowed-domains.js";

@singleton()
export class AutomationAdminController {
  getConfig = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await settingsService.getAutomationConfig());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  updateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { automationUrl } = bodyOf(req);
      if (typeof automationUrl !== "string" || !automationUrl.trim()) {
        res.status(400).json({ error: "La URL de automatización es requerida y debe ser texto" });
        return;
      }
      const parsedUrl = parseAbsoluteUrl(automationUrl.trim());
      if (!parsedUrl) {
        res.status(400).json({ error: "La URL de automatización debe ser una URL absoluta válida" });
        return;
      }
      if (!isAllowedAutomationDomain(parsedUrl.hostname)) {
        res.status(400).json({
          error: "El dominio de la URL de automatización no está permitido",
          allowedDomains: AUTOMATION_ALLOWED_DOMAINS,
        });
        return;
      }
      const savedUrl = await settingsService.setAutomationUrl(parsedUrl.toString());
      res.status(200).json({ automationUrl: savedUrl, source: "db" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
