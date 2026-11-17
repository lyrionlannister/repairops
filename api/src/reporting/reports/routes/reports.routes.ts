import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requireRole } from "../../../identity/auth/middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createReportsRouter = (controller: ReportsController): Router => {
  const router = Router();
  // Los reportes traen ingresos y salarios: solo owner y admin.
  router.use(authMiddleware, tenantMiddleware, requireRole("owner", "admin"));
  router.get("/employee-performance", controller.getEmployeePerformance);
  router.get("/accessory-sales", controller.getAccessorySales);
  router.get("/repair-notes-by-type", controller.getRepairNotesByType);
  return router;
};
