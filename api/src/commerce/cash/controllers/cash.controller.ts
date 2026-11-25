import { singleton } from "tsyringe";
import { readPageQuery } from "../../../core/common/utils/page-query.js";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CashService } from "../services/cash.service.js";
import { OpenCashSessionDto } from "../dtos/open-cash-session.dto.js";
import { CloseCashSessionDto } from "../dtos/close-cash-session.dto.js";
import { RegisterCashMovementDto } from "../dtos/register-cash-movement.dto.js";
import { flattenValidationErrors as validationErrors } from "../../../core/common/utils/validation-errors.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { PdfRendererService } from "../../../reporting/pdf/pdf-renderer.service.js";
import { CashCutDocument } from "../../../reporting/pdf/documents/cash-cut.document.js";
import { toCashCutPdfData } from "../../../reporting/pdf/documents/cash-cut.pdf-data.js";

@singleton()
export class CashController {
  constructor(
    private service: CashService,
    private branchAccess: BranchAccessService,
    private localService: LocalService,
    private pdfRendererService: PdfRendererService,
  ) {}

  getAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      res.status(200).json(await this.service.getAllSessions(branchId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getOpenSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const localId = req.query["localId"];
      if (!localId || typeof localId !== "string") {
        res.status(400).json({ error: "Se requiere la sucursal" });
        return;
      }
      res.status(200).json(await this.service.getOpenSession(localId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getSessionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await this.service.getSessionById(req.params["id"] as string);
      if (!session) {
        res.status(404).json({ error: "Sesión de caja no encontrada" });
        return;
      }
      res.status(200).json(session);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  openSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(OpenCashSessionDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const localId = await this.branchAccess.resolveWriteBranch(dto.localId);
      const session = await this.service.openSession(localId, dto.openingBalance);
      res.status(201).json(session);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  closeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CloseCashSessionDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const session = await this.service.closeSession(
        req.params["id"] as string,
        dto.closingBalance,
        dto.reason,
        dto.authorizedByEmployeeId,
      );
      res.status(200).json(session);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  getMovements = async (req: Request, res: Response): Promise<void> => {
    try {
      const movements = await this.service.getMovements(req.params["id"] as string);
      if (!movements) {
        res.status(404).json({ error: "Sesión de caja no encontrada" });
        return;
      }
      res.status(200).json(movements);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  registerMovement = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RegisterCashMovementDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const movement = await this.service.registerMovement({
        cashSessionId: req.params["id"] as string,
        type: dto.type,
        method: dto.method,
        amount: dto.amount,
        note: dto.note,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
      });
      res.status(201).json(movement);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.service.getSummary(req.params["id"] as string);
      if (!summary) {
        res.status(404).json({ error: "Sesión de caja no encontrada" });
        return;
      }
      res.status(200).json(summary);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getCuts = async (req: Request, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      const page = await readPageQuery(req.query);
      res
        .status(200)
        .json(page ? await this.service.getCutsPage(branchId, page) : await this.service.getCuts(branchId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getLastCut = async (req: Request, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      res.status(200).json(await this.service.getLastCut(branchId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getVarianceStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      res.status(200).json(await this.service.getVarianceStats(branchId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getCut = async (req: Request, res: Response): Promise<void> => {
    try {
      const cut = await this.service.getCut(req.params["id"] as string);
      if (!cut) {
        res.status(404).json({ error: "Corte de caja no encontrado" });
        return;
      }
      res.status(200).json(cut);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getCutPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const cut = await this.service.getCut(req.params["id"] as string);
      if (!cut) {
        res.status(404).json({ error: "Corte de caja no encontrado" });
        return;
      }
      const local = await this.localService.getConfig();
      const data = toCashCutPdfData(cut, local);
      const buffer = await this.pdfRendererService.render(CashCutDocument, { data });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="corte-${cut.cut.cutNumber}.pdf"`);
      res.status(200).send(buffer);
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
