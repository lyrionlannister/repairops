import { Router } from "express";
import express from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdParam } from "../../../core/http/public-id/public-id-request.js";

export const createInventoryRouter = (controller: InventoryController): Router => {
  const router = Router();
  router.param("id", publicIdParam("inventory_items"));
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("inventory.read", "inventory.lookup"), controller.getAll);
  router.post("/import", requirePermission("inventory.manage"), express.raw({ type: "*/*", limit: "10mb" }), controller.bulkImport);
  router.get("/lookup", requirePermission("inventory.read", "inventory.lookup"), controller.lookup);
  router.get("/stats", requirePermission("inventory.read"), controller.getStats);
  router.get("/low-stock", requirePermission("inventory.read"), controller.getLowStock);
  router.get("/by-sku/:sku", requirePermission("inventory.read", "inventory.lookup"), controller.getBySku);
  router.get("/:id", requirePermission("inventory.read", "inventory.lookup"), controller.getById);
  router.post("/", requirePermission("inventory.manage"), controller.create);
  router.patch("/:id", requirePermission("inventory.manage"), controller.update);
  router.delete("/:id", requirePermission("inventory.manage"), controller.delete);
  router.get("/:id/movements", requirePermission("inventory.read"), controller.getMovements);
  router.post("/:id/movements", requirePermission("inventory.adjust"), controller.registerMovement);
  return router;
};
