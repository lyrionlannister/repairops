import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { LocalService, LocalValidationError } from "../services/local.service.js";

@singleton()
export class LocalController {
  constructor(private localService: LocalService) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    try {
      const config = await this.localService.getConfigWithPalette();
      res.status(200).json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await this.localService.updateConfig(req.body);
      res.status(200).json(config);
    } catch (error: any) {
      res.status(error instanceof LocalValidationError ? 400 : 500).json({ error: error.message });
    }
  };
}
