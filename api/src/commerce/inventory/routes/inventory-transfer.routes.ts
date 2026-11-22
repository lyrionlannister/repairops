import { Router } from "express";
import { InventoryTransferController } from "../controllers/inventory-transfer.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createInventoryTransferRouter = (controller: InventoryTransferController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("inventory.transfer"), controller.getAll);
  router.post("/", requirePermission("inventory.transfer"), controller.create);
  return router;
};
