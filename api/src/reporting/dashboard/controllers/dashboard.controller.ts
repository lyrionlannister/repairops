import { singleton } from "tsyringe";
import { Response } from "express";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { DashboardService, DashboardValidationError } from "../services/dashboard.service.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { errorStatus, queryString } from "../../../core/http/error-status.js";

const statusOf = (error: unknown): number => (error instanceof DashboardValidationError ? 400 : errorStatus(error, 500));

@singleton()
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private branchAccess: BranchAccessService,
  ) {}

  // La sucursal se resuelve en el servidor: el owner puede pedir una o todas (sin branchId);
  // el personal siempre recibe la suya.
  getSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      res.status(200).json(await this.dashboardService.getSummary(req.user!.role, branchId ?? undefined));
    } catch (error: any) {
      res.status(statusOf(error)).json({ error: error.message });
    }
  };

  getSeries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      const series = await this.dashboardService.getSeries(req.user!.role, {
        granularity: queryString(req.query["granularity"]),
        year: queryString(req.query["year"]),
        branchId: branchId ?? undefined,
      });
      res.status(200).json(series);
    } catch (error: any) {
      res.status(statusOf(error)).json({ error: error.message });
    }
  };
}
