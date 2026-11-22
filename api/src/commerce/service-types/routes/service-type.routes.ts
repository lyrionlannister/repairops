import { Router } from "express";
import { ServiceTypeController } from "../controllers/service-type.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createServiceTypeRouter = (controller: ServiceTypeController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("settings.manage", "repair-notes.read", "repair-notes.read.own", "quotes.read", "quotes.read.own"), controller.getAll);
  router.post("/", requirePermission("settings.manage"), controller.create);
  return router;
};
