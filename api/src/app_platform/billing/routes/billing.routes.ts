import { Router } from "express";
import { BillingController } from "../controllers/billing.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission, requirePlatformPermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createBillingRouter = (controller: BillingController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/plan", requirePermission("billing.read"), controller.getPlan);
  return router;
};

export const createPlatformBillingRouter = (controller: BillingController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/plans", requirePlatformPermission("platform.plans.manage"), controller.listPlans);
  router.get("/tenants", requirePlatformPermission("platform.tenants.read"), controller.listTenants);
  router.patch("/tenants/:tenantId/subscription", requirePlatformPermission("platform.subscriptions.manage"), controller.assignSubscription);
  return router;
};
