import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { RepairNoteService } from "../services/repair-note.service.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { AuthService } from "../../../identity/auth/services/auth.service.js";
import { PdfRendererService } from "../../../reporting/pdf/pdf-renderer.service.js";
import { RepairNoteDocument } from "../../../reporting/pdf/documents/repair-note.document.js";
import { toRepairNotePdfData } from "../../../reporting/pdf/documents/repair-note.pdf-data.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { errorStatus, queryString } from "../../../core/http/error-status.js";

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
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      const notes = await this.repairNoteService.getAll(branchId);
      res.status(200).json(notes);
    } catch (error: any) {
      res.status(errorStatus(error, 500)).json({ error: error.message });
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { items, serviceTypeIds, ...data } = req.body;
      data.localId = await this.branchAccess.resolveWriteBranch(data.localId);
      const note = await this.repairNoteService.create(data, items, serviceTypeIds);
      res.status(201).json(note);
    } catch (error: any) {
      res.status(errorStatus(error, 400)).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { items, serviceTypeIds, ...data } = req.body;
      if (data.localId !== undefined) data.localId = await this.branchAccess.resolveWriteBranch(data.localId);
      const note = await this.repairNoteService.update(id, data, items, serviceTypeIds);
      if (!note) {
        res.status(404).json({ error: "Nota no encontrada" });
        return;
      }
      res.status(200).json(note);
    } catch (error: any) {
      res.status(errorStatus(error, 500)).json({ error: error.message });
    }
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const note = await this.repairNoteService.cancel(id);
      res.status(200).json(note);
    } catch (error: any) {
      res.status(error.message === "Nota no encontrada" ? 404 : 400).json({ error: error.message });
    }
  };

  getItems = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.repairNoteService.getItems(req.params["id"] as string));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getServiceTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.repairNoteService.getServiceTypeIds(req.params["id"] as string));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      const serviceTypeNames = await this.repairNoteService.getServiceTypeNames(note.id);
      const qrUrl = await this.repairNoteService.getWhatsappQrUrl(note);
      const data = toRepairNotePdfData(note, local, { assignedEmployeeName, serviceTypeNames, qrUrl });
      const buffer = await this.pdfRendererService.render(RepairNoteDocument, { data });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="nota-${note.controlNumber}.pdf"`);
      res.status(200).send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
