import { singleton } from "tsyringe";
import { Response } from "express";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { DashboardService, DashboardValidationError } from "../services/dashboard.service.js";

const queryString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

@singleton()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.dashboardService.getSummary(req.user!.role, queryString(req.query["branchId"])));
    } catch (error: any) {
      res.status(error instanceof DashboardValidationError ? 400 : 500).json({ error: error.message });
    }
  };

  getSeries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const series = await this.dashboardService.getSeries(req.user!.role, {
        granularity: queryString(req.query["granularity"]),
        year: queryString(req.query["year"]),
        branchId: queryString(req.query["branchId"]),
      });
      res.status(200).json(series);
    } catch (error: any) {
      res.status(error instanceof DashboardValidationError ? 400 : 500).json({ error: error.message });
    }
  };
}
