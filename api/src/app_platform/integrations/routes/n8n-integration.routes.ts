import { Router } from "express";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePlatformPermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { N8nIntegrationController } from "../controllers/n8n-integration.controller.js";

export function createN8nIntegrationRouter(controller: N8nIntegrationController): Router {
  const router = Router();
  router.use(
    authMiddleware,
    tenantMiddleware,
    requirePlatformPermission("platform.integrations.manage"),
  );
  router.get("/", controller.getConfig);
  router.patch("/", controller.updateConfig);
  return router;
}
