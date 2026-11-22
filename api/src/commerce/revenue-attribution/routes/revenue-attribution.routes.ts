import { Router } from "express";
import { RevenueAttributionController } from "../controllers/revenue-attribution.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createRevenueAttributionRouter = (controller: RevenueAttributionController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/revenue-attribution", requirePermission("settings.manage"), controller.getSetting);
  router.patch("/revenue-attribution", requirePermission("settings.manage"), controller.updateSetting);
  return router;
};
