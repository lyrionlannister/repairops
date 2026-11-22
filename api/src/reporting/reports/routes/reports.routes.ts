import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createReportsRouter = (controller: ReportsController): Router => {
  const router = Router();
  // Los reportes traen ingresos y salarios: solo owner y admin.
  router.use(authMiddleware, tenantMiddleware);
  router.get("/employee-performance", requirePermission("reports.read"), controller.getEmployeePerformance);
  router.get("/accessory-sales", requirePermission("reports.read"), controller.getAccessorySales);
  router.get("/repair-notes-by-type", requirePermission("reports.read"), controller.getRepairNotesByType);
  return router;
};
