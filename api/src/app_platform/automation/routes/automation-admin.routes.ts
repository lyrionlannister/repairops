import { Router } from "express";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePlatformPermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { AutomationAdminController } from "../controllers/automation-admin.controller.js";

export function createAutomationAdminRouter(controller: AutomationAdminController): Router {
  const router = Router();
  router.use(
    authMiddleware,
    tenantMiddleware,
    requirePlatformPermission("platform.integrations.manage"),
  );
  router.get("/config", controller.getConfig);
  router.patch("/config", controller.updateConfig);
  return router;
}
