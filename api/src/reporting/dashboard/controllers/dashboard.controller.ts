import { singleton } from "tsyringe";
import { Response } from "express";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { DashboardService, DashboardValidationError } from "../services/dashboard.service.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";

const fallbackStatusOf = (error: unknown): number => (error instanceof DashboardValidationError ? 400 : 500);

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
      res.status(200).json(await this.dashboardService.getSummary(req.user!.permissions?.has("dashboard.money") ?? false, branchId ?? undefined));
    } catch (error: any) {
      sendError(res, error, fallbackStatusOf(error));
    }
  };

  getSeries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const branchId = await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"]));
      const series = await this.dashboardService.getSeries(req.user!.permissions?.has("dashboard.money") ?? false, {
        granularity: queryString(req.query["granularity"]),
        year: queryString(req.query["year"]),
        branchId: branchId ?? undefined,
      });
      res.status(200).json(series);
    } catch (error: any) {
      sendError(res, error, fallbackStatusOf(error));
    }
  };
}
