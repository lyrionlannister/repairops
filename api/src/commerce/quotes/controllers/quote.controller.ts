import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { QuoteService } from "../services/quote.service.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { PdfRendererService } from "../../../reporting/pdf/pdf-renderer.service.js";
import { QuoteDocument } from "../../../reporting/pdf/documents/quote.document.js";
import { toQuotePdfData } from "../../../reporting/pdf/documents/quote.pdf-data.js";
import { CreateQuoteDto } from "../dtos/create-quote.dto.js";
import { UpdateQuoteDto } from "../dtos/update-quote.dto.js";
import { SetQuoteStatusDto } from "../dtos/set-quote-status.dto.js";
import { flattenValidationErrors as validationErrors } from "../../../core/common/utils/validation-errors.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";

@singleton()
export class QuoteController {
  constructor(
    private service: QuoteService,
    private localService: LocalService,
    private pdfRendererService: PdfRendererService,
    private branchAccess: BranchAccessService,
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      res.status(200).json(await this.service.getAll(branchId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const quote = await this.service.getById(req.params["id"] as string);
      if (!quote) {
        res.status(404).json({ error: "Cotización no encontrada" });
        return;
      }
      res.status(200).json(quote);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getItems = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getItems(req.params["id"] as string));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getServiceTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getServiceTypeIds(req.params["id"] as string));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateQuoteDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      if (!dto.customerId && !String(dto.contactNumber ?? "").trim()) {
        res.status(400).json({ error: "El teléfono del cliente es obligatorio" });
        return;
      }
      const { items, serviceTypeIds, ...data } = dto;
      data.localId = await this.branchAccess.resolveWriteBranch(data.localId);
      const quote = await this.service.create(data, items, serviceTypeIds ?? []);
      res.status(201).json(quote);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(UpdateQuoteDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const { items, serviceTypeIds, ...data } = dto;
      const quote = await this.service.update(req.params["id"] as string, data, items, serviceTypeIds);
      if (!quote) {
        res.status(404).json({ error: "Cotización no encontrada" });
        return;
      }
      res.status(200).json(quote);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  setStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(SetQuoteStatusDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const quote = await this.service.setStatus(req.params["id"] as string, dto.status);
      if (!quote) {
        res.status(404).json({ error: "Cotización no encontrada" });
        return;
      }
      res.status(200).json(quote);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.service.delete(req.params["id"] as string);
      if (!deleted) {
        res.status(404).json({ error: "Cotización no encontrada" });
        return;
      }
      res.status(200).json({ message: "Cotización eliminada" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const quote = await this.service.getById(req.params["id"] as string);
      if (!quote) {
        res.status(404).json({ error: "Cotización no encontrada" });
        return;
      }
      const items = await this.service.getItems(quote.id);
      const local = await this.localService.getConfig();
      const serviceTypeNames = quote.kind === "repair" ? await this.service.getServiceTypeNames(quote.id) : [];
      const data = toQuotePdfData(quote, items, local, { serviceTypeNames });
      const buffer = await this.pdfRendererService.render(QuoteDocument, { data });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="cotizacion-${quote.id}.pdf"`);
      res.status(200).send(buffer);
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
