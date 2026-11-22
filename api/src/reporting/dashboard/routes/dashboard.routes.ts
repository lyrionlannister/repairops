import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createDashboardRouter = (controller: DashboardController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/summary", requirePermission("dashboard.read"), controller.getSummary);
  router.get("/series", requirePermission("dashboard.read"), controller.getSeries);
  return router;
};
