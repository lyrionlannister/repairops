import { Router } from "express";
import { InventoryCountController } from "../controllers/inventory-count.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createInventoryCountRouter = (controller: InventoryCountController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.post("/", controller.open);
  router.get("/:id", controller.getById);
  router.patch("/:id/items/:itemId", controller.setCounted);
  router.post("/:id/close", controller.close);
  return router;
};
