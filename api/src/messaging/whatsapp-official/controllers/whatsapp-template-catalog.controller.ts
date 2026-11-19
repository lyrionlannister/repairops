import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  WhatsappTemplateCatalogService,
  WhatsappTemplateCatalogConflictError,
} from "../services/whatsapp-template-catalog.service.js";
import { CreateWhatsappTemplateCatalogEntryDto } from "../dtos/create-whatsapp-template-catalog-entry.dto.js";
import { UpdateWhatsappTemplateCatalogEntryDto } from "../dtos/update-whatsapp-template-catalog-entry.dto.js";
import { WhatsappGraphApiError } from "../clients/whatsapp-graph.client.js";
import { flattenValidationErrors as validationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class WhatsappTemplateCatalogController {
  constructor(private whatsappTemplateCatalogService: WhatsappTemplateCatalogService) {}

  private handleError(error: any, res: Response): void {
    if (
      error instanceof WhatsappTemplateCatalogConflictError ||
      error instanceof WhatsappGraphApiError
    ) {
      sendError(res, error, 400);
      return;
    }
    sendError(res, error, 500);
  }

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.whatsappTemplateCatalogService.listForTenant());
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateWhatsappTemplateCatalogEntryDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      res.status(201).json(await this.whatsappTemplateCatalogService.create(dto));
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(UpdateWhatsappTemplateCatalogEntryDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const entry = await this.whatsappTemplateCatalogService.update(
        req.params["id"] as string,
        dto,
      );
      if (!entry) {
        res.status(404).json({ error: "Plantilla no encontrada" });
        return;
      }
      res.status(200).json(entry);
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.whatsappTemplateCatalogService.delete(req.params["id"] as string);
      if (!deleted) {
        res.status(404).json({ error: "Plantilla no encontrada" });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  listSystem = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.whatsappTemplateCatalogService.listSystem());
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  createSystem = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateWhatsappTemplateCatalogEntryDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      res.status(201).json(await this.whatsappTemplateCatalogService.createSystem(dto));
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  updateSystem = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(UpdateWhatsappTemplateCatalogEntryDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const entry = await this.whatsappTemplateCatalogService.updateSystem(
        req.params["id"] as string,
        dto,
      );
      if (!entry) {
        res.status(404).json({ error: "Plantilla no encontrada" });
        return;
      }
      res.status(200).json(entry);
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  removeSystem = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.whatsappTemplateCatalogService.deleteSystem(
        req.params["id"] as string,
      );
      if (!deleted) {
        res.status(404).json({ error: "Plantilla no encontrada" });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      this.handleError(error, res);
    }
  };
}
