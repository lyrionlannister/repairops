import { Router } from "express";
import { PriceListController } from "../controllers/price-list.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createPriceListRouter = (controller: PriceListController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);

  router.get("/", requirePermission("settings.manage"), controller.getAll);
  router.post("/", requirePermission("settings.manage"), controller.create);
  router.patch("/:id", requirePermission("settings.manage"), controller.update);
  router.delete("/:id", requirePermission("settings.manage"), controller.delete);
  return router;
};
