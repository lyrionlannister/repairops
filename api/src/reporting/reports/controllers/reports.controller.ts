import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ReportsService } from "../services/reports.service.js";
import { EmployeePerformanceQueryDto } from "../dtos/employee-performance-query.dto.js";
import { AccessorySalesQueryDto } from "../dtos/accessory-sales-query.dto.js";
import { RepairNotesByTypeQueryDto } from "../dtos/repair-notes-by-type-query.dto.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";

@singleton()
export class ReportsController {
  constructor(
    private service: ReportsService,
    private branchAccess: BranchAccessService,
  ) {}

  // Los reportes son solo del owner: sin branchId suman todas las sucursales.
  private branchOf = (req: Request) => this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));

  getEmployeePerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(EmployeePerformanceQueryDto, req.query);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(200).json(await this.service.getEmployeePerformance({ ...dto, branchId: await this.branchOf(req) }));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getAccessorySales = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(AccessorySalesQueryDto, req.query);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(200).json(await this.service.getAccessorySales({ ...dto, branchId: await this.branchOf(req) }));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getRepairNotesByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RepairNotesByTypeQueryDto, req.query);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      res.status(200).json(await this.service.getRepairNotesByType({ ...dto, branchId: await this.branchOf(req) }));
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
