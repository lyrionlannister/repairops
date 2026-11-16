import { Router } from "express";
import { InventoryTransferController } from "../controllers/inventory-transfer.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createInventoryTransferRouter = (controller: InventoryTransferController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", controller.getAll);
  router.post("/", controller.create);
  return router;
};
