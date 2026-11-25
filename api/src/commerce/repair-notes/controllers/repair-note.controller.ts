import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { RepairNoteService, type DeliveryPaymentInput } from "../services/repair-note.service.js";
import type { CreateRepairNoteBody, UpdateRepairNoteBody } from "../types/repair-note-body.types.js";
import { bodyOf, optionalString } from "../../../core/http/request-body.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { AuthService } from "../../../identity/auth/services/auth.service.js";
import { PdfRendererService } from "../../../reporting/pdf/pdf-renderer.service.js";
import { RepairNoteDocument } from "../../../reporting/pdf/documents/repair-note.document.js";
import { toRepairNotePdfData } from "../../../reporting/pdf/documents/repair-note.pdf-data.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { readPageQuery } from "../../../core/common/utils/page-query.js";
import type { RepairNoteFilters } from "../types/repair-note-page.types.js";

@singleton()
export class RepairNoteController {
  constructor(
    private repairNoteService: RepairNoteService,
    private localService: LocalService,
    private pdfRendererService: PdfRendererService,
    private authService: AuthService,
    private branchAccess: BranchAccessService,
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.filtersOf(req);
      const page = await readPageQuery(req.query);
      if (page) {
        res.status(200).json(await this.repairNoteService.getPage({ ...filters, search: page.search }, page));
        return;
      }
      if (filters.customerId) {
        const history = await this.repairNoteService.getPage(filters, { page: 1, pageSize: 100 });
        res.status(200).json(history.items);
        return;
      }
      const notes = await this.repairNoteService.getAll(filters.branchId);
      res.status(200).json(notes);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.repairNoteService.getStats(await this.filtersOf(req)));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  private async filtersOf(req: Request): Promise<RepairNoteFilters> {
    return {
      branchId: await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"])),
      customerId: queryString(req.query["customerId"]) || undefined,
      assignedEmployeeId: queryString(req.query["assignedEmployeeId"]) || undefined,
      status: queryString(req.query["status"]) || undefined,
    };
  }

  getKnownBrands = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.repairNoteService.getKnownBrands());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const note = await this.repairNoteService.getById(id);
      if (!note) {
        res.status(404).json({ error: "Nota no encontrada" });
        return;
      }
      res.status(200).json({ ...note, whatsappQrUrl: await this.repairNoteService.getWhatsappQrUrl(note) });
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getByControlNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const controlNumber = Number(req.params["controlNumber"]);
      if (!Number.isInteger(controlNumber)) {
        res.status(400).json({ error: "Número de control inválido" });
        return;
      }
      const note = await this.repairNoteService.getByControlNumber(controlNumber);
      if (!note) {
        res.status(404).json({ error: "Nota no encontrada" });
        return;
      }
      res.status(200).json(note);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { items, advancePayment, ...data } = req.body as CreateRepairNoteBody;
      data.localId = await this.branchAccess.resolveWriteBranch(data.localId);
      const note = await this.repairNoteService.create(data, items, advancePayment);
      res.status(201).json(note);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  deliver = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payments, createdByEmployeeId } = bodyOf(req);
      const note = await this.repairNoteService.deliver(req.params["id"] as string, {
        payments: Array.isArray(payments) ? (payments as DeliveryPaymentInput[]) : [],
        createdByEmployeeId: optionalString(createdByEmployeeId),
      });
      res.status(200).json(note);
    } catch (error) {
      sendError(res, error, error instanceof Error && error.message === "Nota no encontrada" ? 404 : 400);
    }
  };

  getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.repairNoteService.getPayments(req.params["id"] as string));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { items, ...data } = req.body as UpdateRepairNoteBody;
      if (data.localId !== undefined) data.localId = await this.branchAccess.resolveWriteBranch(data.localId);
      const note = await this.repairNoteService.update(id, data, items);
      if (!note) {
        res.status(404).json({ error: "Nota no encontrada" });
        return;
      }
      res.status(200).json(note);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const note = await this.repairNoteService.cancel(id);
      res.status(200).json(note);
    } catch (error) {
      sendError(res, error, error instanceof Error && error.message === "Nota no encontrada" ? 404 : 400);
    }
  };

  getItems = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.repairNoteService.getItems(req.params["id"] as string));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getServiceTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const serviceTypeIds = await this.repairNoteService.getServiceTypeIds(req.params["id"] as string);
      res.status(200).json({ serviceTypeIds });
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const note = await this.repairNoteService.getById(req.params["id"] as string);
      if (!note) {
        res.status(404).json({ error: "Nota no encontrada" });
        return;
      }
      const local = await this.localService.getConfig();
      const assignedEmployeeName = note.assignedEmployeeId
        ? await this.authService.getEmployeeName(note.assignedEmployeeId)
        : null;
      const serviceTypeNames = await this.repairNoteService.serviceTypeNameResolver();
      const qrUrl = await this.repairNoteService.getWhatsappQrUrl(note);
      const data = toRepairNotePdfData(note, local, { assignedEmployeeName, serviceTypeNames, qrUrl });
      const buffer = await this.pdfRendererService.render(RepairNoteDocument, { data });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="nota-${note.controlNumber}.pdf"`);
      res.status(200).send(buffer);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const deleted = await this.repairNoteService.delete(id);
      if (!deleted) {
        res.status(404).json({ error: "Nota no encontrada" });
        return;
      }
      res.status(200).json({ message: "Nota eliminada" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
