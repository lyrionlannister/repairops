import { Router } from "express";
import { InventoryCountController } from "../controllers/inventory-count.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";

export const createInventoryCountRouter = (controller: InventoryCountController): Router => {
  const router = Router();
  router.param("id", publicIdParam("inventory_counts"));
  router.param("itemId", publicIdParam("inventory_count_items"));
  router.use(authMiddleware, tenantMiddleware);
  router.post("/", requirePermission("inventory.count"), controller.open);
  router.get("/:id", requirePermission("inventory.count"), controller.getById);
  router.patch("/:id/items/:itemId", requirePermission("inventory.count"), controller.setCounted);
  router.post("/:id/close", requirePermission("inventory.count"), controller.close);
  return router;
};
