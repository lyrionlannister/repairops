import { singleton } from "tsyringe";
import type { Request, Response } from "express";
import { bodyOf } from "../../../core/http/request-body.js";
import { settingsService } from "../../../identity/settings/settings.service.js";
import { parseAbsoluteUrl } from "../../../core/common/utils/absolute-url.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class N8nIntegrationController {
  getConfig = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await settingsService.getN8nIntegrationConfig());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  updateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { n8nEditorUrl } = bodyOf(req);
      if (typeof n8nEditorUrl !== "string" || !n8nEditorUrl.trim()) {
        res.status(400).json({ error: "La URL del editor de n8n es requerida y debe ser texto" });
        return;
      }
      const parsedUrl = parseAbsoluteUrl(n8nEditorUrl.trim());
      if (!parsedUrl) {
        res.status(400).json({ error: "n8nEditorUrl debe ser una URL absoluta válida" });
        return;
      }
      if (parsedUrl.protocol !== "https:") {
        res.status(400).json({ error: "n8nEditorUrl debe usar HTTPS" });
        return;
      }
      const savedUrl = await settingsService.setN8nEditorUrl(parsedUrl.toString());
      res.status(200).json({ n8nEditorUrl: savedUrl, source: "db" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
